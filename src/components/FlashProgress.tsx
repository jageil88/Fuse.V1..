import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import Svg, {
  Circle,
  Polygon,
  Defs,
  ClipPath,
  Rect,
} from 'react-native-svg';
import { COLORS, FONTS } from '../constants/theme';

const RADIUS = 95;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;

const BOLT_POINTS = '75,55 125,55 110,110 125,110 131,165 110,110 98,110';
const BOLT_TOP = 55;
const BOLT_BOTTOM = 165;
const BOLT_HEIGHT = BOLT_BOTTOM - BOLT_TOP;

const STATUS_STEPS = [
  { at: 0,  text: 'VERBINDE...',       sub: 'Bluetooth wird hergestellt' },
  { at: 8,  text: 'AUTHENTIFIZIERE',   sub: 'Scooter wird erkannt' },
  { at: 15, text: 'PRÜFE FIRMWARE',    sub: 'Kompatibilität wird geprüft' },
  { at: 22, text: 'ÜBERTRAGE',         sub: 'Block 1 / 64' },
  { at: 35, text: 'ÜBERTRAGE',         sub: 'Block 22 / 64' },
  { at: 50, text: 'ÜBERTRAGE',         sub: 'Block 32 / 64' },
  { at: 65, text: 'ÜBERTRAGE',         sub: 'Block 42 / 64' },
  { at: 80, text: 'ÜBERTRAGE',         sub: 'Block 51 / 64' },
  { at: 90, text: 'FAST FERTIG',       sub: 'Letzte Blöcke werden übertragen' },
  { at: 96, text: 'VERIFIZIERE',       sub: 'Prüfsumme wird berechnet' },
  { at: 100, text: 'FERTIG',           sub: 'Firmware erfolgreich installiert' },
];

function getStatus(progress: number) {
  let s = STATUS_STEPS[0];
  for (const step of STATUS_STEPS) {
    if (progress >= step.at) s = step;
  }
  return s;
}

interface FlashProgressProps {
  progress: number; // 0-100
  modelName?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function FlashProgress({ progress, modelName }: FlashProgressProps) {
  const strokeOffset = useRef(new Animated.Value(CIRCUMFERENCE)).current;
  const boltFlicker = useRef(new Animated.Value(1)).current;
  const displayPercent = useRef(new Animated.Value(0)).current;
  const [displayNum, setDisplayNum] = useState(0);
  const flickerAnim = useRef<Animated.CompositeAnimation | null>(null);

  const isDone = progress >= 100;

  // Animated ring
  useEffect(() => {
    const targetOffset = CIRCUMFERENCE * (1 - progress / 100);
    Animated.timing(strokeOffset, {
      toValue: targetOffset,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Percent counter
    Animated.timing(displayPercent, {
      toValue: progress,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    displayPercent.addListener(({ value }) => {
      setDisplayNum(Math.round(value));
    });

    return () => displayPercent.removeAllListeners();
  }, [progress]);

  // Bolt flicker while flashing
  useEffect(() => {
    if (flickerAnim.current) {
      flickerAnim.current.stop();
    }
    if (!isDone && progress > 5) {
      flickerAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(boltFlicker, { toValue: 0.55, duration: 120, useNativeDriver: true }),
          Animated.timing(boltFlicker, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(boltFlicker, { toValue: 0.75, duration: 100, useNativeDriver: true }),
          Animated.timing(boltFlicker, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
      flickerAnim.current.start();
    } else {
      Animated.timing(boltFlicker, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isDone, progress > 5]);

  const fillHeight = (progress / 100) * BOLT_HEIGHT;
  const fillY = BOLT_BOTTOM - fillHeight;

  const ringColor = isDone ? COLORS.green : COLORS.purple;
  const boltFillColor = isDone ? COLORS.green : COLORS.purple;
  const statusColor = isDone ? COLORS.green : COLORS.purple;

  const status = getStatus(progress);

  return (
    <View style={styles.container}>
      {modelName && (
        <Text style={styles.modelName}>{modelName}</Text>
      )}

      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Defs>
            <ClipPath id="boltClip">
              <Rect
                x={60}
                y={fillY}
                width={90}
                height={fillHeight + 2}
              />
            </ClipPath>
          </Defs>

          {/* Track */}
          <Circle
            cx={CX} cy={CY} r={RADIUS}
            fill="none"
            stroke="#141414"
            strokeWidth={8}
          />

          {/* Progress ring */}
          <AnimatedCircle
            cx={CX} cy={CY} r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={8}
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${CX}, ${CY}`}
          />

          {/* Corner dots */}
          {[0, 90, 180, 270].map((deg) => {
            const rad = (deg - 90) * (Math.PI / 180);
            const r2 = RADIUS + 14;
            return (
              <Circle
                key={deg}
                cx={CX + r2 * Math.cos(rad)}
                cy={CY + r2 * Math.sin(rad)}
                r={3}
                fill={ringColor}
                opacity={0.35}
              />
            );
          })}

          {/* Bolt background */}
          <Polygon
            points={BOLT_POINTS}
            fill="#1a0a2e"
          />

          {/* Bolt fill (animated from bottom up) */}
          <Animated.View style={{ opacity: boltFlicker }}>
            <Polygon
              points={BOLT_POINTS}
              fill={boltFillColor}
              clipPath="url(#boltClip)"
            />
          </Animated.View>

          {/* Bolt outline */}
          <Polygon
            points={BOLT_POINTS}
            fill="none"
            stroke={ringColor}
            strokeWidth={1.2}
            opacity={0.3}
          />
        </Svg>
      </View>

      {/* Percent */}
      <View style={styles.percentRow}>
        <Text style={styles.percentNum}>{displayNum}</Text>
        <Text style={styles.percentUnit}>%</Text>
      </View>

      {/* Status */}
      <Text style={[styles.statusText, { color: statusColor }]}>
        {status.text}
      </Text>
      <Text style={styles.subText}>{status.sub}</Text>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: `${progress}%`,
              backgroundColor: ringColor,
            },
          ]}
        />
      </View>

      {/* Warning */}
      {!isDone && (
        <Text style={styles.warning}>
          Scooter nicht trennen
        </Text>
      )}
      {isDone && (
        <Text style={styles.successMsg}>
          Scooter wird neu gestartet...
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modelName: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 24,
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    marginBottom: 8,
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  percentNum: {
    fontFamily: FONTS.mono,
    fontSize: 52,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 56,
  },
  percentUnit: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.purple,
    marginBottom: 6,
    marginLeft: 2,
  },
  statusText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    letterSpacing: 2,
    marginTop: 8,
    color: COLORS.purple,
  },
  subText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  barTrack: {
    width: 200,
    height: 3,
    backgroundColor: '#1a0a2e',
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  warning: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.orange,
    marginTop: 16,
    letterSpacing: 1,
  },
  successMsg: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.green,
    marginTop: 16,
    letterSpacing: 1,
  },
});
