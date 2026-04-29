import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '../constants/theme';
import { bleService } from '../utils/ble';
import { store } from '../store/store';

interface Props { hardwareMaxKmh: number; }

export default function UnlockScreen({ hardwareMaxKmh }: Props) {
  const [speed, setSpeed] = useState(25);
  const [region, setRegion] = useState<'DE' | 'US' | 'INT'>('DE');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [confirmedOver60, setConfirmedOver60] = useState(false);

  const zoneColor = () => {
    if (speed > 60) return COLORS.red;
    if (speed > hardwareMaxKmh) return COLORS.orange;
    return COLORS.green;
  };

  const zoneLabel = () => {
    if (speed > 60) return 'AKKU-KILLER ZONE';
    if (speed > hardwareMaxKmh) return 'ÜBER HARDWARE-MAX';
    return 'NORMALER BEREICH';
  };

  const apply = async () => {
    if (speed > 60 && !confirmedOver60) {
      Alert.alert(
        'Bist du sicher?',
        `${speed} km/h ist weit über dem Hardware-Maximum deines Scooters. Akku wird schnell leer, Motor kann überhitzen.`,
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: 'Ich weiß was ich tue',
            style: 'destructive',
            onPress: () => { setConfirmedOver60(true); doApply(); },
          },
        ]
      );
      return;
    }
    if (speed > hardwareMaxKmh && speed <= 60) {
      Alert.alert(
        'Über Hardware-Max',
        `Dein Scooter ist für ~${hardwareMaxKmh} km/h ausgelegt. Der Motor dreht auf Maximum — Akku-Verbrauch steigt stark.`,
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Trotzdem anwenden', onPress: doApply },
        ]
      );
      return;
    }
    doApply();
  };

  const doApply = async () => {
    setLoading(true);
    try {
      await bleService.setSpeedLimit(speed);
      await bleService.setRegion(region);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    } catch (e) {
      Alert.alert('Fehler', 'Einstellung konnte nicht übertragen werden.');
    }
    setLoading(false);
  };

  const regions: Array<'DE' | 'US' | 'INT'> = ['DE', 'US', 'INT'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Speed section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>GESCHWINDIGKEIT</Text>

        <View style={styles.speedDisplay}>
          <Text style={[styles.speedNum, { color: zoneColor() }]}>{speed}</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>

        <View style={[styles.zonePill, { backgroundColor: zoneColor() + '22', borderColor: zoneColor() }]}>
          <View style={[styles.zoneDot, { backgroundColor: zoneColor() }]} />
          <Text style={[styles.zoneText, { color: zoneColor() }]}>{zoneLabel()}</Text>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={100}
          step={1}
          value={speed}
          onValueChange={v => { setSpeed(v); setConfirmedOver60(false); }}
          minimumTrackTintColor={zoneColor()}
          maximumTrackTintColor={COLORS.border}
          thumbTintColor={COLORS.purple}
        />

        <View style={styles.sliderMarkers}>
          <Text style={styles.marker}>5</Text>
          <Text style={[styles.marker, { color: COLORS.green }]}>{hardwareMaxKmh}</Text>
          <Text style={[styles.marker, { color: COLORS.orange }]}>60</Text>
          <Text style={[styles.marker, { color: COLORS.red }]}>100</Text>
        </View>

        <Text style={styles.hint}>
          Hardware-Max deines Scooters: ~{hardwareMaxKmh} km/h
        </Text>
      </View>

      {/* Region section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>REGION</Text>
        <View style={styles.regionRow}>
          {regions.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.regionBtn, region === r && styles.regionBtnActive]}
              onPress={() => setRegion(r)}
            >
              <Text style={[styles.regionText, region === r && styles.regionTextActive]}>
                {r}
              </Text>
              <Text style={styles.regionSub}>
                {r === 'DE' ? '20 km/h' : r === 'US' ? 'unlimitiert' : 'Standard'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Apply button */}
      <TouchableOpacity
        style={[styles.applyBtn, applied && styles.applyBtnSuccess, loading && styles.applyBtnLoading]}
        onPress={apply}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.applyText}>
          {loading ? 'WIRD ANGEWENDET…' : applied ? '✓ ANGEWENDET' : 'ANWENDEN'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Änderungen werden direkt an den Scooter übertragen.{'\n'}
        Neustart des Scooters empfohlen.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20 },
  section: {
    backgroundColor: COLORS.bgCard, borderWidth: 0.5,
    borderColor: COLORS.border, borderRadius: 16,
    padding: 20, marginTop: 16,
  },
  sectionLabel: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.textMuted, letterSpacing: 2, marginBottom: 16,
  },
  speedDisplay: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'center', marginBottom: 12,
  },
  speedNum: {
    fontFamily: FONTS.mono, fontSize: 72,
    fontWeight: '700', lineHeight: 80,
  },
  speedUnit: {
    fontFamily: FONTS.mono, fontSize: 18,
    color: COLORS.textMuted, marginBottom: 10, marginLeft: 6,
  },
  zonePill: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'center', paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: 20,
    borderWidth: 0.5, gap: 6, marginBottom: 16,
  },
  zoneDot: { width: 6, height: 6, borderRadius: 3 },
  zoneText: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1 },
  slider: { width: '100%', height: 40 },
  sliderMarkers: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 4, marginTop: -4,
  },
  marker: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted,
  },
  hint: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.textMuted, textAlign: 'center',
    marginTop: 8, letterSpacing: 0.5,
  },
  regionRow: { flexDirection: 'row', gap: 8 },
  regionBtn: {
    flex: 1, backgroundColor: COLORS.bg,
    borderWidth: 0.5, borderColor: COLORS.border,
    borderRadius: 10, padding: 12, alignItems: 'center',
  },
  regionBtnActive: {
    borderColor: COLORS.purple, backgroundColor: COLORS.purpleMuted,
  },
  regionText: {
    fontFamily: FONTS.mono, fontSize: 14,
    fontWeight: '700', color: COLORS.textSecondary,
  },
  regionTextActive: { color: COLORS.purple },
  regionSub: {
    fontFamily: FONTS.mono, fontSize: 9,
    color: COLORS.textMuted, marginTop: 3,
  },
  applyBtn: {
    backgroundColor: COLORS.purple, borderRadius: 12,
    padding: 18, alignItems: 'center', marginTop: 20,
  },
  applyBtnSuccess: { backgroundColor: COLORS.green },
  applyBtnLoading: { backgroundColor: COLORS.purpleDim },
  applyText: {
    fontFamily: FONTS.mono, fontSize: 13,
    fontWeight: '700', color: COLORS.white, letterSpacing: 3,
  },
  footer: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.textMuted, textAlign: 'center',
    marginTop: 16, marginBottom: 40, lineHeight: 18,
  },
});
