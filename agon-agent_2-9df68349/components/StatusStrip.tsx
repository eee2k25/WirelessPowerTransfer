import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors } from '../lib/theme';
import { Chip } from './ui';
import { LinkStatus, VehicleRole, WptState } from '../lib/types';

export function StatusStrip({
  theme,
  role,
  link,
  wpt,
  demo,
  donorOnline,
  fault,
}: {
  theme: ThemeColors;
  role: VehicleRole | null;
  link: LinkStatus;
  wpt: WptState;
  demo: boolean;
  donorOnline?: boolean;
  fault?: string;
}) {
  const linkTone = link === 'connected' ? 'ok' : link === 'connecting' ? 'warn' : link === 'error' ? 'fault' : 'idle';
  const wptTone =
    wpt === 'active' ? 'ok' : wpt === 'emergency' || wpt === 'fault' ? 'fault' : wpt === 'ready' || wpt === 'checking' ? 'info' : 'idle';
  return (
    <View style={styles.row}>
      <Chip
        theme={theme}
        tone={role === 'DONOR' ? 'amber' : role === 'RECEIVER' ? 'info' : 'idle'}
        icon={role === 'DONOR' ? 'flash' : 'battery-charging'}
        label={role === 'DONOR' ? 'DONOR EV' : role === 'RECEIVER' ? 'RECEIVER EV' : 'NO ROLE'}
      />
      <Chip
        theme={theme}
        tone={linkTone}
        icon="hardware-chip"
        label={link === 'connected' ? 'ESP32' : link.toUpperCase()}
      />
      <Chip theme={theme} tone={wptTone} icon="radio" label={wpt === 'active' ? 'WPT ON' : `WPT ${wpt.toUpperCase()}`} />
      {demo ? <Chip theme={theme} tone="warn" icon="beaker" label="DEMO" /> : null}
      {role === 'DONOR' ? (
        <Chip theme={theme} tone={donorOnline ? 'ok' : 'idle'} icon="ellipse" label={donorOnline ? 'ONLINE' : 'OFFLINE'} />
      ) : null}
      {fault && fault !== 'NONE' ? <Chip theme={theme} tone="fault" icon="warning" label={fault} /> : null}
    </View>
  );
}

export function SafetyNote({ theme }: { theme: ThemeColors }) {
  return (
    <View style={[styles.note, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
      <Ionicons name="shield-checkmark" size={14} color={theme.textMuted} />
      <Text style={[styles.noteTxt, { color: theme.textMuted }]}>
        App is a high-level command / monitor. Over-current, over-voltage, over-temperature and power-stage shutdown remain on the hardware.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  note: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start' },
  noteTxt: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '600' },
});
