import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar,
} from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface Props { onAccept: () => void; }

export default function DisclaimerScreen({ onAccept }: Props) {
  const [seconds, setSeconds] = useState(30);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { setDone(true); clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <Text style={styles.badge}>⚠ WICHTIGER HINWEIS</Text>
        <Text style={styles.title}>Nutzungsbedingungen</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.body}>
          Fuse ist ein Werkzeug für die Anpassung von E-Scootern ausschließlich auf{' '}
          <Text style={styles.hl}>privatem Gelände</Text>.
          {'\n\n'}
          ◆  Die Nutzung auf öffentlichen Straßen, Wegen oder Plätzen ist{' '}
          <Text style={styles.hl}>verboten</Text> und kann strafbar sein.
          {'\n\n'}
          ◆  Durch die Veränderung der Firmware oder Geschwindigkeitsgrenzen{' '}
          erlischt die Betriebserlaubnis des Fahrzeugs.
          {'\n\n'}
          ◆  Du übernimmst die{' '}
          <Text style={styles.hl}>volle Verantwortung</Text>{' '}
          für alle vorgenommenen Änderungen und deren Folgen.
          {'\n\n'}
          ◆  Weder die Entwickler von Fuse noch beteiligte Dritte haften für{' '}
          Schäden an Personen, Tieren, Fahrzeugen oder sonstigem Eigentum.
          {'\n\n'}
          ◆  Geschwindigkeiten über der Fahrzeughardware-Kapazität können zu{' '}
          Überhitzung, Defekten oder Unfällen führen.
          {'\n\n'}
          Fuse ist ausschließlich für erfahrene Nutzer gedacht, die die{' '}
          technischen Grundlagen kennen und die Risiken einschätzen können.
          {'\n\n'}
          Durch das Akzeptieren bestätigst du, dass du alle oben genannten{' '}
          Bedingungen verstanden hast und diesen zustimmst.
        </Text>
      </ScrollView>

      <TouchableOpacity
        style={[styles.btn, !done && styles.btnDisabled]}
        onPress={done ? onAccept : undefined}
        activeOpacity={done ? 0.8 : 1}
      >
        {done ? (
          <Text style={styles.btnText}>ICH VERSTEHE & AKZEPTIERE</Text>
        ) : (
          <Text style={styles.btnWait}>BITTE LESEN… {seconds}s</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.bg,
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 32,
  },
  header: { marginBottom: 20 },
  badge: {
    fontFamily: FONTS.mono, fontSize: 10,
    color: COLORS.orange, letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.mono, fontSize: 20,
    fontWeight: '700', color: COLORS.white,
  },
  scroll: { flex: 1, marginBottom: 16 },
  body: {
    fontFamily: FONTS.mono, fontSize: 13,
    color: COLORS.textSecondary, lineHeight: 22,
  },
  hl: { color: COLORS.orange, fontWeight: '700' },
  btn: {
    backgroundColor: COLORS.purple, borderRadius: 12,
    padding: 18, alignItems: 'center',
  },
  btnDisabled: { backgroundColor: COLORS.purpleDim },
  btnText: {
    fontFamily: FONTS.mono, fontSize: 12,
    fontWeight: '700', color: COLORS.white,
    letterSpacing: 2,
  },
  btnWait: {
    fontFamily: FONTS.mono, fontSize: 12,
    color: COLORS.textMuted, letterSpacing: 1,
  },
});
