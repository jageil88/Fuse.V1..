import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '../constants/theme';
import { bleService } from '../utils/ble';
import { store, PoliceConfig } from '../store/store';

const ACTIONS = [
  { id: 'brake_left',  label: 'L-Bremse' },
  { id: 'brake_right', label: 'R-Bremse' },
  { id: 'gas',         label: 'Gas' },
];

export default function PoliceModeScreen() {
  const cfg = store.state.policeConfig;
  const [combo, setCombo] = useState<string[]>(cfg.combo);
  const [speedLimit, setSpeedLimit] = useState(cfg.speedLimit);
  const [enabled, setEnabled] = useState(cfg.enabled);
  const [saved, setSaved] = useState(false);

  const addToCombo = (action: string) => {
    if (combo.length >= 8) {
      Alert.alert('Maximum', 'Maximal 8 Aktionen in der Kombo.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCombo([...combo, action]);
  };

  const removeLastCombo = () => {
    if (combo.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCombo(combo.slice(0, -1));
  };

  const clearCombo = () => setCombo([]);

  const save = async () => {
    if (combo.length < 2) {
      Alert.alert('Zu kurz', 'Kombo muss mindestens 2 Aktionen haben.');
      return;
    }
    const config: PoliceConfig = { enabled, speedLimit, combo };
    await store.savePoliceConfig(config);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testActivate = async () => {
    const wasActive = store.state.policeModeActive;
    store.togglePoliceMode();
    if (!wasActive) {
      await bleService.applyPoliceMode(speedLimit);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('GHOST MODE AN', `Scooter auf ${speedLimit} km/h begrenzt.\nAußenstehende Apps sehen nur ${speedLimit} km/h.`);
    } else {
      await bleService.setSpeedLimit(100);
      Alert.alert('Ghost Mode AUS', 'Normale Einstellungen wiederhergestellt.');
    }
  };

  const comboLabel = (id: string) => ACTIONS.find(a => a.id === id)?.label ?? id;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.cardLabel}>POLICE MODE</Text>
            <Text style={styles.cardTitle}>Ghost Mode</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleBtn, enabled && styles.toggleBtnActive]}
            onPress={() => setEnabled(!enabled)}
          >
            <Text style={[styles.toggleText, enabled && styles.toggleTextActive]}>
              {enabled ? 'AN' : 'AUS'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardDesc}>
          Wenn aktiv: Scooter fährt max. {speedLimit} km/h.{'\n'}
          Segway/Xiaomi App sieht nur {speedLimit} km/h.{'\n'}
          Aktivierung per Bremse/Gas Kombo.
        </Text>
      </View>

      {/* Speed limit */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LIMIT-GESCHWINDIGKEIT</Text>
        <View style={styles.speedRow}>
          <Text style={styles.speedNum}>{speedLimit}</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={5}
          maximumValue={35}
          step={1}
          value={speedLimit}
          onValueChange={setSpeedLimit}
          minimumTrackTintColor={COLORS.red}
          maximumTrackTintColor={COLORS.border}
          thumbTintColor={COLORS.purple}
        />
        <View style={styles.sliderMarks}>
          <Text style={styles.marker}>5</Text>
          <Text style={styles.marker}>15</Text>
          <Text style={styles.marker}>20</Text>
          <Text style={styles.marker}>25</Text>
          <Text style={styles.marker}>35</Text>
        </View>
        <Text style={styles.hint}>
          Empfohlen: 20 km/h (DE) oder 22 km/h (AT/CH)
        </Text>
      </View>

      {/* Combo builder */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>AKTIVIERUNGS-KOMBO</Text>
        <Text style={styles.comboHint}>
          Baue deine eigene Sequenz. Der Scooter aktiviert Ghost Mode{'\n'}
          wenn du diese Kombo an der Bremse/Gas eingibst.
        </Text>

        {/* Combo display */}
        <View style={styles.comboDisplay}>
          {combo.length === 0 ? (
            <Text style={styles.comboEmpty}>Keine Kombo — tippe unten</Text>
          ) : (
            combo.map((c, i) => (
              <View key={i} style={styles.comboChip}>
                <Text style={styles.comboChipText}>{comboLabel(c)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {ACTIONS.map(a => (
            <TouchableOpacity
              key={a.id}
              style={styles.actionBtn}
              onPress={() => addToCombo(a.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.comboControls}>
          <TouchableOpacity style={styles.comboCtrlBtn} onPress={removeLastCombo}>
            <Text style={styles.comboCtrlText}>← LETZTES</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.comboCtrlBtn} onPress={clearCombo}>
            <Text style={[styles.comboCtrlText, { color: COLORS.red }]}>LEEREN</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.comboPreview}>
          Aktuelle Kombo: {combo.map(comboLabel).join(' → ') || '—'}
        </Text>
      </View>

      {/* Test + Save */}
      <TouchableOpacity
        style={[styles.testBtn, store.state.policeModeActive && styles.testBtnActive]}
        onPress={testActivate}
        activeOpacity={0.8}
      >
        <Text style={styles.testText}>
          {store.state.policeModeActive ? '🔴 GHOST MODE DEAKTIVIEREN' : '👻 GHOST MODE TESTEN'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveBtn, saved && styles.saveBtnDone]}
        onPress={save}
        activeOpacity={0.8}
      >
        <Text style={styles.saveText}>
          {saved ? '✓ GESPEICHERT' : 'EINSTELLUNGEN SPEICHERN'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20 },
  headerCard: {
    backgroundColor: '#1a0000', borderWidth: 1,
    borderColor: COLORS.red, borderRadius: 16,
    padding: 20, marginTop: 16,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 12,
  },
  cardLabel: {
    fontFamily: FONTS.mono, fontSize: 9,
    color: COLORS.red, letterSpacing: 2,
  },
  cardTitle: {
    fontFamily: FONTS.mono, fontSize: 20,
    fontWeight: '700', color: COLORS.white, marginTop: 2,
  },
  cardDesc: {
    fontFamily: FONTS.mono, fontSize: 12,
    color: COLORS.textSecondary, lineHeight: 20,
  },
  toggleBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  toggleBtnActive: {
    borderColor: COLORS.red, backgroundColor: '#2a0000',
  },
  toggleText: {
    fontFamily: FONTS.mono, fontSize: 12,
    fontWeight: '700', color: COLORS.textMuted,
  },
  toggleTextActive: { color: COLORS.red },
  section: {
    backgroundColor: COLORS.bgCard, borderWidth: 0.5,
    borderColor: COLORS.border, borderRadius: 16,
    padding: 20, marginTop: 12,
  },
  sectionLabel: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.textMuted, letterSpacing: 2, marginBottom: 12,
  },
  speedRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'center', marginBottom: 4,
  },
  speedNum: {
    fontFamily: FONTS.mono, fontSize: 56,
    fontWeight: '700', color: COLORS.red,
  },
  speedUnit: {
    fontFamily: FONTS.mono, fontSize: 16,
    color: COLORS.textMuted, marginBottom: 8, marginLeft: 6,
  },
  sliderMarks: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 4, marginTop: -4, marginBottom: 8,
  },
  marker: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted,
  },
  hint: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.textMuted, textAlign: 'center',
  },
  comboHint: {
    fontFamily: FONTS.mono, fontSize: 11,
    color: COLORS.textSecondary, lineHeight: 18, marginBottom: 14,
  },
  comboDisplay: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    minHeight: 44, backgroundColor: COLORS.bg,
    borderRadius: 10, borderWidth: 0.5,
    borderColor: COLORS.border, padding: 10,
    marginBottom: 14, alignItems: 'center',
  },
  comboEmpty: {
    fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted,
  },
  comboChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: COLORS.purpleMuted,
    borderWidth: 0.5, borderColor: COLORS.purple,
    borderRadius: 6,
  },
  comboChipText: {
    fontFamily: FONTS.mono, fontSize: 11, color: COLORS.purple,
  },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  actionBtn: {
    flex: 1, backgroundColor: COLORS.bg,
    borderWidth: 0.5, borderColor: COLORS.border,
    borderRadius: 8, padding: 12, alignItems: 'center',
  },
  actionText: {
    fontFamily: FONTS.mono, fontSize: 11, color: COLORS.white,
  },
  comboControls: {
    flexDirection: 'row', gap: 8, marginBottom: 10,
  },
  comboCtrlBtn: {
    flex: 1, padding: 8, alignItems: 'center',
    borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 8,
  },
  comboCtrlText: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.textMuted, letterSpacing: 1,
  },
  comboPreview: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.purple, lineHeight: 16,
  },
  testBtn: {
    borderWidth: 1, borderColor: COLORS.red,
    borderRadius: 12, padding: 16, alignItems: 'center',
    marginTop: 16, backgroundColor: '#0a0000',
  },
  testBtnActive: { backgroundColor: '#1a0000' },
  testText: {
    fontFamily: FONTS.mono, fontSize: 12,
    fontWeight: '700', color: COLORS.red, letterSpacing: 1,
  },
  saveBtn: {
    backgroundColor: COLORS.purple, borderRadius: 12,
    padding: 18, alignItems: 'center', marginTop: 10,
  },
  saveBtnDone: { backgroundColor: COLORS.green },
  saveText: {
    fontFamily: FONTS.mono, fontSize: 12,
    fontWeight: '700', color: COLORS.white, letterSpacing: 2,
  },
});
