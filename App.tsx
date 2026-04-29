import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, SafeAreaView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS, FONTS, APP_PASSWORD } from './src/constants/theme';
import { store } from './src/store/store';
import { getScooterById } from './src/constants/scooters';

import PasswordScreen from './src/screens/PasswordScreen';
import DisclaimerScreen from './src/screens/DisclaimerScreen';
import ScanScreen from './src/screens/ScanScreen';
import HomeScreen from './src/screens/HomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import UnlockScreen from './src/screens/UnlockScreen';
import PoliceModeScreen from './src/screens/PoliceModeScreen';
import ToolsScreen from './src/screens/ToolsScreen';

type Screen =
  | 'password' | 'disclaimer' | 'scan'
  | 'home' | 'dashboard' | 'unlock' | 'police' | 'tools';

const PASS_KEY = 'fuse_app_unlocked';

export default function App() {
  const [screen, setScreen] = useState<Screen>('password');
  const [ready, setReady] = useState(false);
  const [modelId, setModelId] = useState<string>('');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    await store.load();
    // Check if already unlocked this session
    const unlocked = await SecureStore.getItemAsync(PASS_KEY);
    if (unlocked === 'yes') {
      // Still need disclaimer on first launch
      if (store.state.firstLaunch) {
        setScreen('disclaimer');
      } else {
        setScreen('scan');
      }
    }
    setReady(true);
  };

  const onPasswordUnlock = async () => {
    await SecureStore.setItemAsync(PASS_KEY, 'yes');
    if (store.state.firstLaunch) {
      setScreen('disclaimer');
    } else {
      setScreen('scan');
    }
  };

  const onDisclaimerAccept = async () => {
    await store.setFirstLaunchDone();
    setScreen('scan');
  };

  const onConnected = (deviceId: string, mId: string) => {
    setModelId(mId);
    setScreen('home');
  };

  const onDisconnect = () => {
    setModelId('');
    setScreen('scan');
  };

  const navigate = (s: string) => {
    setScreen(s as Screen);
  };

  if (!ready) return (
    <View style={styles.loading}>
      <Text style={styles.loadingText}>FUSE</Text>
    </View>
  );

  const model = getScooterById(modelId);
  const isConnected = screen !== 'password' && screen !== 'disclaimer' && screen !== 'scan';

  const navItems = [
    { id: 'home',      label: 'Home',    icon: '⌂' },
    { id: 'dashboard', label: 'Live',    icon: '◉' },
    { id: 'unlock',    label: 'Tuning',  icon: '⚡' },
    { id: 'police',    label: 'Ghost',   icon: '👻' },
    { id: 'tools',     label: 'Tools',   icon: '⚙' },
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

        {/* Screens */}
        <View style={{ flex: 1 }}>
          {screen === 'password' && (
            <PasswordScreen onUnlock={onPasswordUnlock} />
          )}
          {screen === 'disclaimer' && (
            <DisclaimerScreen onAccept={onDisclaimerAccept} />
          )}
          {screen === 'scan' && (
            <ScanScreen onConnected={onConnected} />
          )}
          {screen === 'home' && (
            <HomeScreen
              modelId={modelId}
              onNavigate={navigate}
              onDisconnect={onDisconnect}
            />
          )}
          {screen === 'dashboard' && (
            <DashboardScreen modelName={model?.displayName ?? 'Scooter'} />
          )}
          {screen === 'unlock' && (
            <UnlockScreen hardwareMaxKmh={model?.hardwareMaxKmh ?? 30} />
          )}
          {screen === 'police' && (
            <PoliceModeScreen />
          )}
          {screen === 'tools' && (
            <ToolsScreen />
          )}
        </View>

        {/* Bottom nav bar (only when connected) */}
        {isConnected && (
          <View style={styles.navbar}>
            {navItems.map(item => {
              const active = screen === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.navItem}
                  onPress={() => setScreen(item.id as Screen)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navIcon, active && styles.navIconActive]}>
                    {item.icon}
                  </Text>
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  {active && <View style={styles.navDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  loading: {
    flex: 1, backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: {
    fontFamily: FONTS.mono, fontSize: 32,
    fontWeight: '700', color: COLORS.purple,
    letterSpacing: 8,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 0.5, borderColor: COLORS.border,
    paddingBottom: 8, paddingTop: 6,
  },
  navItem: {
    flex: 1, alignItems: 'center', gap: 2, paddingTop: 4,
  },
  navIcon: {
    fontSize: 20, color: COLORS.textMuted,
  },
  navIconActive: { color: COLORS.purple },
  navLabel: {
    fontFamily: FONTS.mono, fontSize: 9,
    color: COLORS.textMuted, letterSpacing: 0.5,
  },
  navLabelActive: { color: COLORS.purple },
  navDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.purple, marginTop: 2,
  },
});
