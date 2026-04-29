import { BleManager, Device, BleError } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { getScooterByBleName } from '../constants/scooters';

const NINEBOT_SVC  = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NINEBOT_WRITE= '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const NINEBOT_READ = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

const MI_SVC   = '000000fe95-0000-1000-8000-00805f9b34fb';
const MI_WRITE = '00000001-0000-0000-0000-000000000000';
const MI_READ  = '00000002-0000-0000-0000-000000000000';

export interface ScooterData {
  speedKmh: number;
  batteryPct: number;
  voltage: number;
  current: number;
  watts: number;
  tempC: number;
  odometer: number;
  isLocked: boolean;
  lightOn: boolean;
  mode: number;
  error: number;
}

const EMPTY_DATA: ScooterData = {
  speedKmh: 0, batteryPct: 0, voltage: 0, current: 0,
  watts: 0, tempC: 0, odometer: 0, isLocked: false,
  lightOn: false, mode: 0, error: 0,
};

function nb_checksum(buf: number[]): number {
  let s = 0;
  for (const b of buf) s += b;
  return (~s) & 0xFFFF;
}

function buildNinebotRead(addr: number, len: number = 1): string {
  const payload = [0x55, 0xAA, 0x03, 0x22, addr & 0xFF, (addr >> 8) & 0xFF, len];
  const cs = nb_checksum(payload.slice(2));
  payload.push(cs & 0xFF, (cs >> 8) & 0xFF);
  return Buffer.from(payload).toString('base64');
}

function buildNinebotWrite(addr: number, value: number): string {
  const v0 = value & 0xFF;
  const v1 = (value >> 8) & 0xFF;
  const payload = [0x55, 0xAA, 0x04, 0x12, addr & 0xFF, (addr >> 8) & 0xFF, v0, v1];
  const cs = nb_checksum(payload.slice(2));
  payload.push(cs & 0xFF, (cs >> 8) & 0xFF);
  return Buffer.from(payload).toString('base64');
}

// Ninebot register addresses
const NB_REGS = {
  SPEED:    0x00,
  BATTERY:  0x22,
  VOLTAGE:  0x23,
  CURRENT:  0x24,
  TEMP:     0x25,
  ODO:      0x29,
  LOCK:     0x70,
  LIGHT:    0x7C,
  MODE:     0x1A,
  SPEED_LIM:0x62,
  ERROR:    0x1C,
};

class BLEService {
  manager: BleManager;
  device: Device | null = null;
  isNinebot = true;
  onData: ((d: ScooterData) => void) | null = null;
  private data: ScooterData = { ...EMPTY_DATA };
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  // ─── SCAN ──────────────────────────────────────────────────
  startScan(cb: (dev: Device, modelId: string | null) => void) {
    this.manager.startDeviceScan(null, { allowDuplicates: false }, (err, dev) => {
      if (err || !dev || !dev.name) return;
      const model = getScooterByBleName(dev.name);
      const isKnown = !!model;
      if (isKnown || dev.name.startsWith('Ninebot') || dev.name.startsWith('Mi')) {
        cb(dev, model?.id ?? null);
      }
    });
  }

  stopScan() {
    this.manager.stopDeviceScan();
  }

  // ─── CONNECT ───────────────────────────────────────────────
  async connect(deviceId: string, brand: 'ninebot' | 'xiaomi'): Promise<void> {
    this.isNinebot = brand === 'ninebot';
    const dev = await this.manager.connectToDevice(deviceId, { autoConnect: true });
    await dev.discoverAllServicesAndCharacteristics();
    this.device = dev;

    const svc  = this.isNinebot ? NINEBOT_SVC  : MI_SVC;
    const read = this.isNinebot ? NINEBOT_READ  : MI_READ;

    dev.monitorCharacteristicForService(svc, read, (err, char) => {
      if (err || !char?.value) return;
      this.parseIncoming(Buffer.from(char.value, 'base64'));
    });

    this.startPolling();
  }

  async disconnect() {
    this.stopPolling();
    if (this.device) {
      try { await this.device.cancelConnection(); } catch (_) {}
      this.device = null;
    }
    this.data = { ...EMPTY_DATA };
  }

  // ─── POLLING ───────────────────────────────────────────────
  private startPolling() {
    this.pollInterval = setInterval(() => this.poll(), 500);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async poll() {
    if (!this.device || !this.isNinebot) return;
    try {
      // Read speed, battery, current in sequence
      await this.writeNinebot(buildNinebotRead(NB_REGS.SPEED, 6));
    } catch (_) {}
  }

  private async writeNinebot(b64: string) {
    if (!this.device) return;
    await this.device.writeCharacteristicWithResponseForService(
      NINEBOT_SVC, NINEBOT_WRITE, b64
    );
  }

  private parseIncoming(buf: Buffer) {
    if (buf.length < 6) return;
    // Ninebot frame: 55 AA len src addr0 addr1 data...
    if (buf[0] === 0x55 && buf[1] === 0xAA) {
      const addr = buf[4] | (buf[5] << 8);
      const payload = buf.slice(6, buf.length - 2);
      this.applyNinebotRegisters(addr, payload);
    }
    if (this.onData) this.onData({ ...this.data });
  }

  private applyNinebotRegisters(startAddr: number, payload: Buffer) {
    for (let i = 0; i + 1 < payload.length; i += 2) {
      const addr = startAddr + i / 2;
      const val = payload.readUInt16LE(i);
      switch (addr) {
        case NB_REGS.SPEED:    this.data.speedKmh   = val / 100;  break;
        case NB_REGS.BATTERY:  this.data.batteryPct  = val;        break;
        case NB_REGS.VOLTAGE:  this.data.voltage     = val / 100;  break;
        case NB_REGS.CURRENT:  this.data.current     = val / 100;
                               this.data.watts = Math.abs(this.data.voltage * this.data.current); break;
        case NB_REGS.TEMP:     this.data.tempC       = val / 10;   break;
        case NB_REGS.ODO:      this.data.odometer    = val / 1000; break;
        case NB_REGS.LOCK:     this.data.isLocked    = val === 1;  break;
        case NB_REGS.LIGHT:    this.data.lightOn     = val === 1;  break;
        case NB_REGS.MODE:     this.data.mode        = val;        break;
        case NB_REGS.ERROR:    this.data.error       = val;        break;
      }
    }
  }

  // ─── COMMANDS ──────────────────────────────────────────────
  async setSpeedLimit(kmh: number) {
    if (!this.device) return;
    const val = Math.round(kmh * 100);
    if (this.isNinebot) {
      await this.writeNinebot(buildNinebotWrite(NB_REGS.SPEED_LIM, val));
    }
  }

  async setLight(on: boolean) {
    if (!this.device || !this.isNinebot) return;
    await this.writeNinebot(buildNinebotWrite(NB_REGS.LIGHT, on ? 1 : 0));
  }

  async setLock(locked: boolean) {
    if (!this.device || !this.isNinebot) return;
    await this.writeNinebot(buildNinebotWrite(NB_REGS.LOCK, locked ? 1 : 0));
  }

  async setMode(mode: number) {
    if (!this.device || !this.isNinebot) return;
    await this.writeNinebot(buildNinebotWrite(NB_REGS.MODE, mode));
  }

  async applyPoliceMode(speedKmh: number) {
    await this.setSpeedLimit(speedKmh);
  }

  async setRegion(region: 'DE' | 'US' | 'INT') {
    if (!this.device || !this.isNinebot) return;
    // Region codes vary by model — generic approach
    const code = region === 'DE' ? 0x07 : region === 'US' ? 0x00 : 0x03;
    await this.writeNinebot(buildNinebotWrite(0x67, code));
  }
}

export const bleService = new BLEService();
