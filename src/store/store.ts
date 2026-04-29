import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PoliceConfig {
  enabled: boolean;
  speedLimit: number;
  combo: string[];
}

export interface GarageEntry {
  id: string;
  modelId: string;
  deviceId: string;
  name: string;
  lastConnected: string;
}

export interface AppState {
  firstLaunch: boolean;
  unlocked: boolean;
  garage: GarageEntry[];
  policeConfig: PoliceConfig;
  units: 'kmh' | 'mph';
  policeModeActive: boolean;
  connectedDeviceId: string | null;
  connectedModelId: string | null;
}

const KEYS = {
  FIRST_LAUNCH: 'fuse_first_launch',
  GARAGE: 'fuse_garage',
  POLICE_CONFIG: 'fuse_police_config',
  UNITS: 'fuse_units',
};

const DEFAULT_POLICE: PoliceConfig = {
  enabled: false,
  speedLimit: 20,
  combo: ['brake_left', 'brake_left', 'brake_right', 'brake_right'],
};

class Store {
  state: AppState = {
    firstLaunch: true,
    unlocked: false,
    garage: [],
    policeConfig: DEFAULT_POLICE,
    units: 'kmh',
    policeModeActive: false,
    connectedDeviceId: null,
    connectedModelId: null,
  };

  async load() {
    try {
      const fl = await AsyncStorage.getItem(KEYS.FIRST_LAUNCH);
      this.state.firstLaunch = fl === null;

      const garage = await AsyncStorage.getItem(KEYS.GARAGE);
      if (garage) this.state.garage = JSON.parse(garage);

      const police = await AsyncStorage.getItem(KEYS.POLICE_CONFIG);
      if (police) this.state.policeConfig = JSON.parse(police);

      const units = await AsyncStorage.getItem(KEYS.UNITS);
      if (units) this.state.units = units as 'kmh' | 'mph';
    } catch (e) {
      console.error('Store load error:', e);
    }
  }

  async setFirstLaunchDone() {
    this.state.firstLaunch = false;
    await AsyncStorage.setItem(KEYS.FIRST_LAUNCH, 'done');
  }

  async saveGarage(entry: GarageEntry) {
    const existing = this.state.garage.findIndex(g => g.deviceId === entry.deviceId);
    if (existing >= 0) {
      this.state.garage[existing] = entry;
    } else {
      this.state.garage.push(entry);
    }
    await AsyncStorage.setItem(KEYS.GARAGE, JSON.stringify(this.state.garage));
  }

  async savePoliceConfig(config: PoliceConfig) {
    this.state.policeConfig = config;
    await AsyncStorage.setItem(KEYS.POLICE_CONFIG, JSON.stringify(config));
  }

  async setUnits(units: 'kmh' | 'mph') {
    this.state.units = units;
    await AsyncStorage.setItem(KEYS.UNITS, units);
  }

  setConnected(deviceId: string, modelId: string) {
    this.state.connectedDeviceId = deviceId;
    this.state.connectedModelId = modelId;
  }

  disconnect() {
    this.state.connectedDeviceId = null;
    this.state.connectedModelId = null;
    this.state.policeModeActive = false;
  }

  togglePoliceMode() {
    this.state.policeModeActive = !this.state.policeModeActive;
    return this.state.policeModeActive;
  }
}

export const store = new Store();
