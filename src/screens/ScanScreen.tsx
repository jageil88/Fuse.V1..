import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Animated, StatusBar, Platform,
} from 'react-native';
import { Device } from 'react-native-ble-plx';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '../constants/theme';
import { bleService } from '../utils/ble';
import { SCOOTER_DATABASE } from '../constants/scooters';
import { store } from '../store/store';

interface ScanResult {
  device: Device;
  modelId: string | null;
  rssi: number;
}

interface Props {
  onConnected: (deviceId: string, modelId: string) => void;
}

export default function ScanScreen({ onConnected }: Props) {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    return () => { bleService.stopScan(); };
  }, []);

  const startScan = () => {
    setResults([]);
    setScanning(true);
    startPulse();

    bleService.startScan((dev, modelId) => {
      setResults(prev => {
        const existing = prev.findIndex(r => r.device.id === dev.id);
        const entry: ScanResult = { device: dev, modelId, rssi: dev.rssi ?? -100 };
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = entry;
          return next;
        }
        return [...prev, entry].sort((a, b) => b.rssi - a.rssi);
      });
    });

    setTimeout(() => {
      bleService.stopScan();
      setScanning(false);
      stopPulse();
    }, 10000);
  };

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
  };

  const connect = async (result: ScanResult) => {
    bleService.stopScan();
    setScanning(false);
    stopPulse();
    setConnecting(result.device.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const model = SCOOTER_DATABASE.find(m => m.id === result.modelId);
      const brand = model?.brand ?? 'ninebot';
      await bleService.connect(result.device.id, brand);

      const finalModelId = result.modelId ?? 'ninebot_g30';
      store.setConnected(result.device.id, finalModelId);

      // Save to garage
      const name = model?.displayName ?? result.device.name ?? 'Unbekannt';
      await store.saveGarage({
        id: result.device.id,
        modelId: finalModelId,
        deviceId: result.device.id,
        name,
        lastConnected: new Date().toISOString(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onConnected(result.device.id, finalModelId);
    } catch (e) {
      setConnecting(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const signalBars = (rssi: number) => {
    if (rssi > -60) return 4;
    if (rssi > -70) return 3;
    if (rssi > -80) return 2;
    return 1;
  };

  const renderItem = ({ item }: { item: ScanResult }) => {
    const model = SCOOTER_DATABASE.find(m => m.id === item.modelId);
    const isConn = connecting === item.device.id;
    const bars = signalBars(item.rssi);

    return (
      <TouchableOpacity
        style={[styles.deviceCard, isConn && styles.deviceCardActive]}
        onPress={() => connect(item)}
        activeOpacity={0.7}
        disabled={!!connecting}
      >
        <View style={styles.deviceLeft}>
          <View style={[
            styles.deviceBadge,
            model?.supportLevel === 'full' ? styles.badgeFull : styles.badgePartial,
          ]}>
            <Text style={styles.deviceBadgeText}>
              {model?.brand === 'xiaomi' ? 'MI' : 'NB'}
            </Text>
          </View>
          <View>
            <Text style={styles.deviceName}>
              {model?.displayName ?? item.device.name}
            </Text>
            <Text style={styles.deviceSub}>
              {model?.supportLevel === 'full' ? '✓ Voll unterstützt' :
               model?.supportLevel === 'partial' ? '~ Teilweise' : item.device.id.slice(0, 8)}
            </Text>
          </View>
        </View>

        <View style={styles.deviceRight}>
          <View style={styles.signalWrap}>
            {[1,2,3,4].map(b => (
              <View key={b} style={[
                styles.signalBar,
                { height: b * 4 + 4 },
                b <= bars ? styles.signalActive : styles.signalInactive,
              ]} />
            ))}
          </View>
          {isConn
            ? <Text style={styles.connecting}>...</Text>
            : <Text style={styles.arrow}>›</Text>
          }
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <Text style={styles.title}>Verbinden</Text>
        <Text style={styles.sub}>Scooter in der Nähe suchen</Text>
      </View>

      {/* Scan button */}
      <View style={styles.scanWrap}>
        <TouchableOpacity onPress={startScan} disabled={scanning || !!connecting}>
          <Animated.View style={[styles.scanBtn, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.scanInner, scanning && styles.scanInnerActive]}>
              <Text style={styles.scanIcon}>⚡</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
        <Text style={styles.scanLabel}>
          {scanning ? 'SUCHE LÄUFT…'
           : connecting ? 'VERBINDE…'
           : results.length > 0 ? `${results.length} GEFUNDEN`
           : 'TIPPEN ZUM SUCHEN'}
        </Text>
      </View>

      {/* Results */}
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={i => i.device.id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {!scanning && results.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            Stell sicher, dass{'\n'}dein Scooter eingeschaltet ist
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 60 },
  header: { paddingHorizontal: 24, marginBottom: 8 },
  title: {
    fontFamily: FONTS.mono, fontSize: 24,
    fontWeight: '700', color: COLORS.white,
  },
  sub: {
    fontFamily: FONTS.mono, fontSize: 11,
    color: COLORS.textMuted, marginTop: 4, letterSpacing: 1,
  },
  scanWrap: { alignItems: 'center', paddingVertical: 32 },
  scanBtn: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 1.5, borderColor: COLORS.purpleDim,
    alignItems: 'center', justifyContent: 'center',
  },
  scanInner: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.purpleMuted,
    borderWidth: 1, borderColor: COLORS.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  scanInnerActive: { backgroundColor: COLORS.purpleDim },
  scanIcon: { fontSize: 36 },
  scanLabel: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.purple, letterSpacing: 2, marginTop: 16,
  },
  list: { flex: 1, paddingHorizontal: 16 },
  deviceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderWidth: 0.5, borderColor: COLORS.border,
    borderRadius: 12, padding: 16, marginBottom: 10,
  },
  deviceCardActive: {
    borderColor: COLORS.purple, backgroundColor: COLORS.purpleMuted,
  },
  deviceLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  deviceBadge: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeFull: { backgroundColor: COLORS.greenDim, borderWidth: 0.5, borderColor: COLORS.green },
  badgePartial: { backgroundColor: COLORS.orangeDim, borderWidth: 0.5, borderColor: COLORS.orange },
  deviceBadgeText: {
    fontFamily: FONTS.mono, fontSize: 10, fontWeight: '700',
    color: COLORS.white,
  },
  deviceName: {
    fontFamily: FONTS.mono, fontSize: 14,
    fontWeight: '700', color: COLORS.white,
  },
  deviceSub: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.textMuted, marginTop: 2,
  },
  deviceRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signalWrap: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 20,
  },
  signalBar: { width: 4, borderRadius: 2 },
  signalActive: { backgroundColor: COLORS.purple },
  signalInactive: { backgroundColor: COLORS.border },
  arrow: {
    fontFamily: FONTS.mono, fontSize: 20,
    color: COLORS.purple,
  },
  connecting: {
    fontFamily: FONTS.mono, fontSize: 16,
    color: COLORS.purple,
  },
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 20 },
  emptyText: {
    fontFamily: FONTS.mono, fontSize: 12,
    color: COLORS.textMuted, textAlign: 'center',
    lineHeight: 22, letterSpacing: 1,
  },
});
