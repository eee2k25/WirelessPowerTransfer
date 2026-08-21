import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors, radius } from '../lib/theme';

export function Chip({
  label,
  tone,
  theme,
  icon,
}: {
  label: string;
  tone: 'ok' | 'warn' | 'fault' | 'idle' | 'info' | 'amber';
  theme: ThemeColors;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const map = {
    ok: { bg: theme.greenDim, fg: theme.green },
    warn: { bg: theme.orangeDim, fg: theme.orange },
    fault: { bg: theme.redDim, fg: theme.red },
    idle: { bg: theme.cardAlt, fg: theme.textMuted },
    info: { bg: theme.cyanDim, fg: theme.cyan },
    amber: { bg: theme.amberDim, fg: theme.amber },
  }[tone];
  return (
    <View style={[styles.chip, { backgroundColor: map.bg, borderColor: map.fg + '44' }]}>
      {icon ? <Ionicons name={icon} size={12} color={map.fg} style={{ marginRight: 4 }} /> : null}
      <Text style={[styles.chipTxt, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

export function Card({
  children,
  theme,
  style,
  accent,
}: {
  children: React.ReactNode;
  theme: ThemeColors;
  style?: ViewStyle;
  accent?: string;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: '#000',
          borderLeftColor: accent ?? theme.border,
          borderLeftWidth: accent ? 3 : StyleSheet.hairlineWidth,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Metric({
  label,
  value,
  unit,
  theme,
  color,
}: {
  label: string;
  value: string | number;
  unit?: string;
  theme: ThemeColors;
  color?: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, { color: theme.textDim }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <Text style={[styles.metricVal, { color: color ?? theme.text }]}>{value}</Text>
        {unit ? <Text style={[styles.metricUnit, { color: theme.textMuted }]}> {unit}</Text> : null}
      </View>
    </View>
  );
}

export function Btn({
  title,
  onPress,
  theme,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  theme: ThemeColors;
  variant?: 'primary' | 'amber' | 'danger' | 'ghost' | 'blue';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const bg =
    variant === 'primary'
      ? theme.cyan
      : variant === 'amber'
        ? theme.amber
        : variant === 'danger'
          ? theme.red
          : variant === 'blue'
            ? theme.blue
            : 'transparent';
  const fg = variant === 'ghost' ? theme.text : '#071018';
  const ghostFg = variant === 'ghost' ? theme.text : fg;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: variant === 'ghost' ? 'transparent' : bg,
          borderColor: variant === 'ghost' ? theme.borderStrong : bg,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? theme.text : '#071018'} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={16} color={variant === 'ghost' ? theme.text : ghostFg} /> : null}
          <Text style={[styles.btnTxt, { color: variant === 'ghost' ? theme.text : ghostFg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function SectionTitle({ title, hint, theme }: { title: string; hint?: string; theme: ThemeColors }) {
  return (
    <View style={styles.secRow}>
      <Text style={[styles.sec, { color: theme.text }]}>{title}</Text>
      {hint ? <Text style={[styles.hint, { color: theme.textDim }]}>{hint}</Text> : null}
    </View>
  );
}

export function Empty({
  icon,
  title,
  body,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  theme: ThemeColors;
}) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name={icon} size={28} color={theme.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: theme.textMuted }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  metric: { flex: 1, minWidth: 86 },
  metricLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 },
  metricVal: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  metricUnit: { fontSize: 12, fontWeight: '600', marginBottom: 3 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  btnTxt: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, marginTop: 6 },
  sec: { fontSize: 15, fontWeight: '800' },
  hint: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});

export const typo: Record<string, TextStyle> = {};
