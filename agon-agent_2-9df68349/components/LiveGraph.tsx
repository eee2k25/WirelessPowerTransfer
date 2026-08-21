import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ThemeColors } from '../lib/theme';
import { GraphPoint } from '../lib/types';

export type GraphKey = 'v' | 'i' | 'p' | 'eff';

const META: Record<GraphKey, { title: string; unit: string; colorKey: 'cyan' | 'amber' | 'blue' | 'green' }> = {
  v: { title: 'Voltage vs Time', unit: 'V', colorKey: 'cyan' },
  i: { title: 'Current vs Time', unit: 'A', colorKey: 'amber' },
  p: { title: 'Power vs Time', unit: 'W', colorKey: 'blue' },
  eff: { title: 'Efficiency vs Time', unit: '%', colorKey: 'green' },
};

export function LiveGraph({
  points,
  kind,
  theme,
  windowMin,
  onWindow,
}: {
  points: GraphPoint[];
  kind: GraphKey;
  theme: ThemeColors;
  windowMin: number;
  onWindow: (m: number) => void;
}) {
  const H = 128;
  const meta = META[kind];
  const color = theme[meta.colorKey];
  const now = Date.now();
  const from = now - windowMin * 60 * 1000;
  const sliced = useMemo(() => points.filter((p) => p.t >= from), [points, from]);
  const bars = sliced.slice(-48);
  const vals = bars.map((p) => p[kind]);
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;
  const span = Math.max(0.01, max - min);
  const latest = sliced.length ? sliced[sliced.length - 1][kind] : 0;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.head}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>{meta.title}</Text>
          <Text style={[styles.val, { color }]}>
            {latest.toFixed(kind === 'eff' ? 1 : 2)} {meta.unit}
          </Text>
        </View>
        <View style={styles.wins}>
          {[1, 5, 10, 30].map((m) => (
            <Pressable
              key={m}
              onPress={() => onWindow(m)}
              style={[styles.win, { backgroundColor: windowMin === m ? color : theme.cardAlt, borderColor: theme.border }]}
            >
              <Text style={{ color: windowMin === m ? theme.onAccent : theme.textMuted, fontSize: 10, fontWeight: '800' }}>
                {m}m
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={[styles.chart, { height: H, backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
        {bars.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '600' }}>Waiting for INA219 stream…</Text>
          </View>
        ) : (
          bars.map((p, idx) => {
            const h = 8 + ((p[kind] - min) / span) * (H - 24);
            return (
              <View
                key={`${p.t}-${idx}`}
                style={{
                  flex: 1,
                  height: h,
                  backgroundColor: color,
                  borderRadius: 2,
                  opacity: 0.35 + (idx / Math.max(bars.length, 1)) * 0.65,
                  marginHorizontal: 1,
                }}
              />
            );
          })
        )}
      </View>
      <Text style={[styles.foot, { color: theme.textDim }]}>
        {sliced.length ? `${sliced.length} samples · ${windowMin} min window` : 'Start WPT to plot live V / I / P / η'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 13, fontWeight: '800' },
  val: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  wins: { flexDirection: 'row', gap: 4 },
  win: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  foot: { fontSize: 10, fontWeight: '600', marginTop: 6 },
});
