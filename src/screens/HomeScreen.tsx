import React from 'react';
import {
  View, Text, StyleSheet, Image,
  TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import { getScooterById } from '../constants/scooters';
import { store } from '../store/store';
import { bleService } from '../utils/ble';

interface Props {
  modelId: string;
  onNavigate: (screen: string) => void;
  onDisconnect: () => void;
}

export default function HomeScreen({ modelId, onNavigate, onDisconnect }: Props) {
  const model = getScooterById(modelId);
  const policeActive = store.state.policeModeActive;

  const handleDisconnect = async () => {
    await bleService.disconnect();
    store.disconnect();
    onDisconnect();
  };

  const quickActions = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', color: COLORS.purple },
    { id: 'unlock',    label: 'Tuning',    icon: '⚡', color: COLORS.orange },
    { id: 'police',    label: 'Ghost Mode',icon: '👻', color: COLORS.red },
    { id: 'tools',     label: 'Tools',     icon: '🔧', color: COLORS.green },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Ghost mode banner */}
      {policeActive && (
        <View style={styles.ghostBanner}>
          <Text style={styles.ghostText}>
            👻 {model?.displayName ?? 'Scooter'} befindet sich im Ghost Modus —{' '}
            nur {store.state.policeConfig.speedLimit} km/h sichtbar
          </Text>
        </View>
      )}

      {/* Scooter image */}
      <View style={styles.imageContainer}>
        {model?.image ? (
          <Image
            source={model.image}
            style={styles.scooterImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>🛴</Text>
            <Text style={styles.placeholderText}>Kein Bild</Text>
          </View>
        )}
      </View>

      {/* Scooter info */}
      <View style={styles.infoWrap}>
        <Text style={styles.modelName}>{model?.displayName ?? 'Unbekannt'}</Text>
        <View style={styles.statusRow}>
          <View style={[
            styles.statusBadge,
            model?.supportLevel === 'full' ? styles.badgeFull : styles.badgePartial,
          ]}>
            <Text style={[
              styles.statusText,
              model?.supportLevel === 'full' ? { color: COLORS.green } : { color: COLORS.orange },
            ]}>
              {model?.supportLevel === 'full' ? '✓ Voll unterstützt' : '~ Teilweise'}
            </Text>
          </View>
          <View style={styles.connBadge}>
            <View style={styles.connDot} />
            <Text style={styles.connText}>VERBUNDEN</Text>
          </View>
        </View>

        {model?.supportNote && (
          <Text style={styles.noteText}>{model.supportNote}</Text>
        )}
      </View>

      {/* Specs row */}
      {model && (
        <View style={styles.specsRow}>
          <SpecItem label="MOTOR"    value={model.specs.motor} />
          <SpecItem label="AKKU"     value={model.specs.battery} />
          <SpecItem label="REICHWEITE" value={model.specs.range} />
          <SpecItem label="GEWICHT"  value={model.specs.weight} />
        </View>
      )}

      {/* Quick actions */}
      <View style={styles.actionsGrid}>
        {quickActions.map(a => (
          <TouchableOpacity
            key={a.id}
            style={[styles.actionCard, { borderColor: a.color + '44' }]}
            onPress={() => onNavigate(a.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>{a.icon}</Text>
            <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Capabilities */}
      {model && (
        <View style={styles.capSection}>
          <Text style={styles.capTitle}>FÄHIGKEITEN</Text>
          <View style={styles.capGrid}>
            {Object.entries(model.capabilities).map(([key, val]) => (
              <View key={key} style={styles.capItem}>
                <View style={[styles.capDot, { backgroundColor: val ? COLORS.green : COLORS.border }]} />
                <Text style={[styles.capText, !val && styles.capTextOff]}>
                  {key === 'speedUnlock' ? 'Speed Unlock'
                  : key === 'firmwareFlash' ? 'Firmware Flash'
                  : key === 'regionChange' ? 'Region Unlock'
                  : key === 'policeMode' ? 'Ghost Mode'
                  : 'Dashboard'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Disconnect */}
      <TouchableOpacity
        style={styles.disconnectBtn}
        onPress={handleDisconnect}
        activeOpacity={0.7}
      >
        <Text style={styles.disconnectText}>VERBINDUNG TRENNEN</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={specStyles.item}>
      <Text style={specStyles.label}>{label}</Text>
      <Text style={specStyles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  ghostBanner: {
    backgroundColor: '#1a0000', padding: 12,
    borderBottomWidth: 1, borderColor: COLORS.red,
  },
  ghostText: {
    fontFamily: FONTS.mono, fontSize: 11,
    color: COLORS.red, textAlign: 'center', letterSpacing: 0.5,
  },
  imageContainer: {
    height: 220, backgroundColor: COLORS.bgCard,
    marginHorizontal: 20, marginTop: 20,
    borderRadius: 20, borderWidth: 0.5,
    borderColor: COLORS.border, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  scooterImage: { width: '85%', height: '85%' },
  imagePlaceholder: { alignItems: 'center' },
  placeholderIcon: { fontSize: 48 },
  placeholderText: {
    fontFamily: FONTS.mono, fontSize: 11,
    color: COLORS.textMuted, marginTop: 8,
  },
  infoWrap: { paddingHorizontal: 20, paddingTop: 16 },
  modelName: {
    fontFamily: FONTS.mono, fontSize: 22,
    fontWeight: '700', color: COLORS.white,
  },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, borderWidth: 0.5,
  },
  badgeFull: { backgroundColor: COLORS.greenDim, borderColor: COLORS.green },
  badgePartial: { backgroundColor: COLORS.orangeDim, borderColor: COLORS.orange },
  statusText: { fontFamily: FONTS.mono, fontSize: 10 },
  connBadge: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, borderWidth: 0.5,
    borderColor: COLORS.purple, backgroundColor: COLORS.purpleMuted,
  },
  connDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.purple },
  connText: {
    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.purple,
  },
  noteText: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.orange, marginTop: 6,
  },
  specsRow: {
    flexDirection: 'row', paddingHorizontal: 20,
    gap: 0, marginTop: 16,
  },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10, marginTop: 16,
  },
  actionCard: {
    width: '47%', backgroundColor: COLORS.bgCard,
    borderWidth: 0.5, borderRadius: 14,
    padding: 18, alignItems: 'center', gap: 8,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: {
    fontFamily: FONTS.mono, fontSize: 12,
    fontWeight: '700', letterSpacing: 1,
  },
  capSection: {
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: COLORS.bgCard,
    borderWidth: 0.5, borderColor: COLORS.border,
    borderRadius: 14, padding: 16,
  },
  capTitle: {
    fontFamily: FONTS.mono, fontSize: 9,
    color: COLORS.textMuted, letterSpacing: 2, marginBottom: 12,
  },
  capGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  capItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '47%' },
  capDot: { width: 7, height: 7, borderRadius: 3.5 },
  capText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textSecondary },
  capTextOff: { color: COLORS.textMuted },
  disconnectBtn: {
    marginHorizontal: 20, marginTop: 20,
    borderWidth: 0.5, borderColor: COLORS.border,
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  disconnectText: {
    fontFamily: FONTS.mono, fontSize: 11,
    color: COLORS.textMuted, letterSpacing: 2,
  },
});

const specStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center' },
  label: {
    fontFamily: FONTS.mono, fontSize: 8,
    color: COLORS.textMuted, letterSpacing: 1, marginBottom: 2,
  },
  value: {
    fontFamily: FONTS.mono, fontSize: 11,
    fontWeight: '700', color: COLORS.textSecondary,
  },
});
