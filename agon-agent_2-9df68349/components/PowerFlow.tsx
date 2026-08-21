import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors } from '../lib/theme';

const STAGES = [
  { icon: 'car-sport' as const, label: 'Donor EV' },
  { icon: 'battery-charging' as const, label: 'Battery' },
  { icon: 'git-compare' as const, label: 'DC-DC' },
  { icon: 'flash' as const, label: 'ZVS Inv' },
  { icon: 'radio' as const, label: 'Tx Coil' },
  { icon: 'wifi' as const, label: 'RIC' },
  { icon: 'radio-outline' as const, label: 'Rx Coil' },
  { icon: 'swap-vertical' as const, label: 'Rectifier' },
  { icon: 'funnel' as const, label: 'LC Filter' },
  { icon: 'battery-half' as const, label: 'Rx Batt' },
  { icon: 'car-sport-outline' as const, label: 'Receiver' },
];

function PulseDot({ active, theme, delay }: { active: boolean; theme: ThemeColors; delay: number }) {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      p.stopAnimation();
      p.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(p, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(p, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, delay, p]);

  return (
    <Animated.View
      style={{
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: theme.cyan,
        opacity: active ? p.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) : 0.2,
        transform: [{ scale: active ? p.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] }) : 0.7 }],
      }}
    />
  );
}

export function PowerFlow({ active, theme }: { active: boolean; theme: ThemeColors }) {
  return (
    <View style={[styles.wrap, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
      <Text style={[styles.caption, { color: theme.textDim }]}>
        DONOR BATTERY → DC-DC → ZVS / HF INVERTER → Tx ⇄ RIC ⇄ Rx → RECTIFIER → LC FILTER → RECEIVER BATTERY
      </Text>
      <View style={styles.row}>
        {STAGES.map((s, i) => (
          <React.Fragment key={s.label}>
            <View style={styles.node}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: active ? theme.cyanDim : theme.card,
                    borderColor: active ? theme.cyan : theme.border,
                  },
                ]}
              >
                <Ionicons name={s.icon} size={14} color={active ? theme.cyan : theme.textMuted} />
              </View>
              <Text style={[styles.lab, { color: theme.textMuted }]} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
            {i < STAGES.length - 1 ? (
              <View style={styles.dots}>
                <PulseDot active={active} theme={theme} delay={i * 80} />
              </View>
            ) : null}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 14, borderWidth: 1, padding: 10, overflow: 'hidden' },
  caption: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3, marginBottom: 10, lineHeight: 13 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' },
  node: { alignItems: 'center', width: 54, marginVertical: 4 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  lab: { fontSize: 8, fontWeight: '700', textAlign: 'center' },
  dots: { width: 10, alignItems: 'center', justifyContent: 'center' },
});
