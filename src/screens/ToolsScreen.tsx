import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '../constants/theme';
import { bleService } from '../utils/ble';

export default function ToolsScreen() {
  const [light, setLight] = useState(false);
  const [locked, setLocked] = useState(false);
  const [cruise, setCruise] = useState(false);
  const [mode, setMode] = useState(1);

  const toggle = async (type: string, val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (type === 'light') { await bleService.setLight(val); setLight(val); }
      if (type === 'lock')  { await bleService.setLock(val);  setLocked(val); }
      if (type === 'cruise') setCruise(val);
    } catch (_) {}
  };

  const setScooterMode = async (m: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await bleService.setMode(m); setMode(m); } catch (_) {}
  };

  const modes = [
    { id: 0, label: 'ECO',   desc: 'Wenig Leistung, max Reichweite', color: COLORS.green },
    { id: 1, label: 'DRIVE', desc: 'Standard Modus', color: COLORS.purple },
    { id: 2, label: 'SPORT', desc: 'Volle Power', color: COLORS.red },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Modes */}
      <View style={styles.section}>
        <Text style={styles.sLabel}>FAHRMODUS</Text>
        {modes.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.modeCard, mode === m.id && { borderColor: m.color, backgroundColor: m.color + '11' }]}
            onPress={() => setScooterMode(m.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.modeIndicator, { backgroundColor: mode === m.id ? m.color : COLORS.border }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.modeLabel, mode === m.id && { color: m.color }]}>{m.label}</Text>
              <Text style={styles.modeDesc}>{m.desc}</Text>
            </View>
            {mode === m.id && <Text style={[styles.modeCheck, { color: m.color }]}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Toggles */}
      <View style={styles.section}>
        <Text style={styles.sLabel}>STEUERUNG</Text>

        <ToolRow
          icon="💡" label="Licht" sub="Frontlicht an/aus"
          value={light} onToggle={v => toggle('light', v)}
          color={COLORS.orange}
        />
        <ToolRow
          icon="🔒" label="Scooter sperren" sub="BLE Lock aktivieren"
          value={locked} onToggle={v => toggle('lock', v)}
          color={COLORS.red}
        />
        <ToolRow
          icon="🚀" label="Cruise Control" sub="Tempomat"
          value={cruise} onToggle={v => toggle('cruise', v)}
          color={COLORS.green}
        />
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ HINWEIS</Text>
        <Text style={styles.infoText}>
          Tools werden direkt an den Scooter übertragen.{'\n'}
          Einige Funktionen benötigen SHFW (Custom Firmware).
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function ToolRow({ icon, label, sub, value, onToggle, color }: {
  icon: string; label: string; sub: string;
  value: boolean; onToggle: (v: boolean) => void; color: string;
}) {
  return (
    <View style={toolStyles.row}>
      <View style={[toolStyles.iconWrap, { backgroundColor: color + '22' }]}>
        <Text style={toolStyles.icon}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={toolStyles.label}>{label}</Text>
        <Text style={toolStyles.sub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: color }}
        thumbColor={COLORS.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20 },
  section: {
    backgroundColor: COLORS.bgCard, borderWidth: 0.5,
    borderColor: COLORS.border, borderRadius: 16,
    padding: 16, marginTop: 16,
  },
  sLabel: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.textMuted, letterSpacing: 2, marginBottom: 14,
  },
  modeCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 0.5, borderColor: COLORS.border,
    borderRadius: 10, padding: 14, marginBottom: 8, gap: 12,
  },
  modeIndicator: { width: 4, height: 32, borderRadius: 2 },
  modeLabel: {
    fontFamily: FONTS.mono, fontSize: 14,
    fontWeight: '700', color: COLORS.white,
  },
  modeDesc: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.textMuted, marginTop: 2,
  },
  modeCheck: { fontFamily: FONTS.mono, fontSize: 16 },
  infoCard: {
    marginTop: 12, padding: 16,
    borderLeftWidth: 2, borderColor: COLORS.purple,
    backgroundColor: COLORS.purpleMuted, borderRadius: 0,
    borderBottomRightRadius: 10, borderTopRightRadius: 10,
  },
  infoTitle: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.purple, letterSpacing: 1, marginBottom: 6,
  },
  infoText: {
    fontFamily: FONTS.mono, fontSize: 11,
    color: COLORS.textSecondary, lineHeight: 18,
  },
});

const toolStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 10,
    borderBottomWidth: 0.5, borderColor: COLORS.border,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  label: {
    fontFamily: FONTS.mono, fontSize: 13,
    fontWeight: '700', color: COLORS.white,
  },
  sub: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.textMuted, marginTop: 2,
  },
});
