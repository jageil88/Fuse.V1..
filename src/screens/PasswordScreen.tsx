import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, Animated, StatusBar, Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, APP_PASSWORD } from '../constants/theme';

interface Props { onUnlock: () => void; }

export default function PasswordScreen({ onUnlock }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const tryUnlock = () => {
    if (input === APP_PASSWORD) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUnlock();
    } else {
      setError(true);
      setInput('');
      shake();
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Logo */}
      <View style={styles.logoWrap}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>⚡</Text>
        </View>
        <Text style={styles.appName}>FUSE</Text>
        <Text style={styles.appSub}>BLE SCOOTER UTILITY</Text>
      </View>

      {/* Input */}
      <Animated.View style={[styles.inputWrap, { transform: [{ translateX: shakeAnim }] }]}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={input}
          onChangeText={setInput}
          placeholder="Passwort eingeben"
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={tryUnlock}
          returnKeyType="done"
        />
        {error && <Text style={styles.errorText}>Falsches Passwort</Text>}
      </Animated.View>

      <TouchableOpacity style={styles.btn} onPress={tryUnlock} activeOpacity={0.8}>
        <Text style={styles.btnText}>ENTSPERREN</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>v1.0.0 · Privatnutzung</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoWrap: { alignItems: 'center', marginBottom: 48 },
  logoBadge: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: COLORS.purpleMuted,
    borderWidth: 1.5, borderColor: COLORS.purple,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { fontSize: 36 },
  appName: {
    fontFamily: FONTS.mono, fontSize: 32,
    fontWeight: '700', color: COLORS.white,
    letterSpacing: 8,
  },
  appSub: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.purple, letterSpacing: 3,
    marginTop: 4, opacity: 0.6,
  },
  inputWrap: { width: '100%', marginBottom: 16 },
  input: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 16,
    fontFamily: FONTS.mono, fontSize: 15,
    color: COLORS.white, letterSpacing: 2,
  },
  inputError: { borderColor: COLORS.red },
  errorText: {
    fontFamily: FONTS.mono, fontSize: 11,
    color: COLORS.red, marginTop: 6,
    textAlign: 'center', letterSpacing: 1,
  },
  btn: {
    width: '100%', backgroundColor: COLORS.purple,
    borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnText: {
    fontFamily: FONTS.mono, fontSize: 13,
    fontWeight: '700', color: COLORS.white,
    letterSpacing: 3,
  },
  hint: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.textMuted, marginTop: 40,
    letterSpacing: 1,
  },
});
