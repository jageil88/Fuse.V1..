import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import { bleService, ScooterData } from '../utils/ble';
import { store } from '../store/store';

const EMPTY: ScooterData = {
  speedKmh: 0, batteryPct: 0, voltage: 0, current: 0,
  watts: 0, tempC: 0, odometer: 0, isLocked: false,
  lightOn: false, mode: 0, error: 0,
};

interface Props { modelName: string; }

export default function DashboardScreen({ modelName }: Props) {
  const [data, setData] = useState<ScooterData>(EMPTY);
  const [policeActive, setPoliceActive] = useState(false);

  useEffect(() => {
    bleService.onData = (d) => setData(d);
    setPoliceActive(store.state.policeModeActive);
    return () => { bleService.onData = null; };
  }, []);

  const speedColor = () => {
    const s = data.speedKmh;
    if (store.state.policeModeActive) return COLORS.red;
    if (s > 35) return COLORS.red;
    if (s > 25) return COLORS.orange;
    return COLORS.white;
  };

  const battColor = () => {
    if (data.batteryPct > 50) return COLORS.green;
    if (data.batteryPct > 20) return COLORS.orange;
    return COLORS.red;
  };

  const tempColor = () => {
    if (data.tempC > 70) return COLORS.red;
    if (data.tempC > 55) return COLORS.orange;
    return COLORS.textSecondary;
  };

  const modeLabels = ['ECO', 'DRIVE', 'SPORT'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Ghost mode banner */}
      {policeActive && (
        <View style={styles.ghostBanner}>
          <Text style={styles.ghostText}>👻 GHOST MODE AKTIV · {store.state.policeConfig.speedLimit} km/h</Text>
        </View>
      )}

      {/* Model name */}
      <Text style={styles.modelLabel}>{modelName}</Text>

      {/* Speed hero */}
      <View style={styles.speedWrap}>
        <Text style={[styles.speedNum, { color: speedColor() }]}>
          {data.speedKmh.toFixed(1)}
        </Text>
        <Text style={styles.speedUnit}>km/h</Text>
      </View>

      {/* Battery bar */}
      <View style={styles.battWrap}>
        <View style={styles.battTrack}>
          <View style={[
            styles.battFill,
            { width: `${data.batteryPct}%`, backgroundColor: battColor() },
          ]} />
        </View>
        <Text style={[styles.battLabel, { color: battColor() }]}>
          {data.batteryPct}%
        </Text>
      </View>

      {/* Stats grid */}
      <View style={styles.grid}>
        <Stat label="WATT"     value={Math.round(data.watts)}   unit="W"  />
        <Stat label="SPANNUNG" value={data.voltage.toFixed(1)}  unit="V"  />
        <Stat label="STROM"    value={data.current.toFixed(1)}  unit="A"  />
        <Stat label="TEMP"     value={data.tempC.toFixed(0)}    unit="°C" color={tempColor()} />
        <Stat label="TACHO"    value={data.odometer.toFixed(1)} unit="km" />
        <Stat label="FEHLER"   value={data.error === 0 ? 'OK' : data.error.toString()} unit="" color={data.error ? COLORS.red : COLORS.green} />
      </View>

      {/* Mode pills */}
      <View style={styles.modeRow}>
        {modeLabels.map((m, i) => (
          <View key={m} style={[
            styles.modePill,
            data.mode === i && styles.modePillActive,
          ]}>
            <Text style={[
              styles.modePillText,
              data.mode === i && styles.modePillTextActive,
            ]}>{m}</Text>
          </View>
        ))}
      </View>

      {/* Status row */}
      <View style={styles.statusRow}>
        <StatusDot label="LOCK"  active={data.isLocked} />
        <StatusDot label="LICHT" active={data.lightOn} />
        <StatusDot label="BLE"   active color={COLORS.purple} />
        {policeActive && <StatusDot label="GHOST" active color={COLORS.red} />}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, unit, color }: {
  label: string; value: string | number; unit: string; color?: string;
}) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.label}>{label}</Text>
      <View style={statStyles.row}>
        <Text style={[statStyles.value, color ? { color } : {}]}>
          {value}
        </Text>
        {unit ? <Text style={statStyles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function StatusDot({ label, active, color }: {
  label: string; active: boolean; color?: string;
}) {
  const col = color ?? (active ? COLORS.green : COLORS.border);
  return (
    <View style={dotStyles.wrap}>
      <View style={[dotStyles.dot, { backgroundColor: col }]} />
      <Text style={[dotStyles.label, active && { color: col }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  ghostBanner: {
    backgroundColor: '#1a0000', borderBottomWidth: 1,
    borderColor: COLORS.red, padding: 10, alignItems: 'center',
  },
  ghostText: {
    fontFamily: FONTS.mono, fontSize: 11,
    color: COLORS.red, letterSpacing: 1,
  },
  modelLabel: {
    fontFamily: FONTS.mono, fontSize: 11,
    color: COLORS.textMuted, letterSpacing: 2,
    textAlign: 'center', marginTop: 20,
  },
  speedWrap: {
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', alignItems: 'flex-end',
    marginVertical: 8,
  },
  speedNum: {
    fontFamily: FONTS.mono, fontSize: 88,
    fontWeight: '700', lineHeight: 96,
  },
  speedUnit: {
    fontFamily: FONTS.mono, fontSize: 18,
    color: COLORS.textMuted, marginBottom: 14, marginLeft: 6,
  },
  battWrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, gap: 10, marginBottom: 24,
  },
  battTrack: {
    flex: 1, height: 6, backgroundColor: COLORS.bgCard,
    borderRadius: 3, overflow: 'hidden',
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  battFill: { height: '100%', borderRadius: 3 },
  battLabel: {
    fontFamily: FONTS.mono, fontSize: 12,
    fontWeight: '700', minWidth: 36, textAlign: 'right',
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 8, marginBottom: 16,
  },
  modeRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, marginBottom: 16,
  },
  modePill: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, borderWidth: 0.5, borderColor: COLORS.border,
  },
  modePillActive: {
    backgroundColor: COLORS.purpleMuted, borderColor: COLORS.purple,
  },
  modePillText: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.textMuted, letterSpacing: 1,
  },
  modePillTextActive: { color: COLORS.purple },
  statusRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 20, paddingBottom: 32,
  },
});

const statStyles = StyleSheet.create({
  card: {
    width: '47%', backgroundColor: COLORS.bgCard,
    borderWidth: 0.5, borderColor: COLORS.border,
    borderRadius: 12, padding: 14,
  },
  label: {
    fontFamily: FONTS.mono, fontSize: 9,
    color: COLORS.textMuted, letterSpacing: 2, marginBottom: 6,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  value: {
    fontFamily: FONTS.mono, fontSize: 24,
    fontWeight: '700', color: COLORS.white,
  },
  unit: {
    fontFamily: FONTS.mono, fontSize: 11,
    color: COLORS.textMuted, marginBottom: 3,
  },
});

const dotStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: {
    fontFamily: FONTS.mono, fontSize: 9,
    color: COLORS.textMuted, letterSpacing: 1,
  },
});
