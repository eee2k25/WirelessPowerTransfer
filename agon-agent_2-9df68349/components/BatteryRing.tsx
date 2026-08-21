import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../lib/theme';

export function BatteryRing({
  pct,
  size = 118,
  theme,
  label,
  sub,
}: {
  pct: number;
  size?: number;
  theme: ThemeColors;
  label: string;
  sub?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const color = clamped < 20 ? theme.red : clamped < 40 ? theme.orange : theme.cyan;
  const fillH = (size - 18) * (clamped / 100);

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      <View
        style={[
          styles.shell,
          {
            width: size - 8,
            height: size - 8,
            borderColor: color,
            backgroundColor: theme.cardAlt,
          },
        ]}
      >
        <View style={[styles.fill, { height: fillH, backgroundColor: color + '55' }]} />
        <View style={styles.center}>
          <Text style={[styles.pct, { color: theme.text }]}>{Math.round(clamped)}%</Text>
          <Text style={[styles.lab, { color: theme.textMuted }]}>{label}</Text>
          {sub ? <Text style={[styles.sub, { color }]}>{sub}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 999,
    borderWidth: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: { width: '100%' },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pct: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  lab: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 1 },
  sub: { fontSize: 10, fontWeight: '700', marginTop: 2, textAlign: 'center' },
});
