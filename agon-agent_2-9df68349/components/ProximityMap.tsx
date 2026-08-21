import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors } from '../lib/theme';
import { CAMPUS_ZONES, LocalXY, ProximityInfo, SelfFix } from '../lib/location';

const W = 320;
const H = 220;
const RANGE = 220;

function toPx(p: LocalXY) {
  return {
    left: W / 2 + (p.x / RANGE) * (W / 2 - 18) - 10,
    top: H / 2 - (p.y / RANGE) * (H / 2 - 18) - 10,
  };
}

export function ProximityMap({
  theme,
  self,
  peer,
  proximity,
  peerLabel,
  hideExact,
}: {
  theme: ThemeColors;
  self: SelfFix;
  peer: LocalXY | null;
  proximity: ProximityInfo | null;
  peerLabel: string;
  hideExact: boolean;
}) {
  const selfPx = toPx(self.xy);
  const peerPx = peer ? toPx(peer) : null;
  const ring = proximity?.inWptRange ? theme.cyan : proximity?.inMeetRange ? theme.amber : theme.blue;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
      <View style={styles.captionRow}>
        <Text style={[styles.kicker, { color: theme.textDim }]}>PROXIMITY TRACKING</Text>
        <Text style={[styles.kicker, { color: theme.orange }]}>{hideExact ? 'PIN HIDDEN' : 'ZONE + RANGE'}</Text>
      </View>
      <View style={[styles.canvas, { backgroundColor: theme.bg, borderColor: theme.border }]}>
        <View style={[styles.ring, { borderColor: theme.border, width: 170, height: 170, marginLeft: -85, marginTop: -85 }]} />
        <View style={[styles.ring, { borderColor: ring + '66', width: 92, height: 92, marginLeft: -46, marginTop: -46 }]} />
        {CAMPUS_ZONES.map((z) => {
          const px = toPx({ x: z.cx, y: z.cy });
          return (
            <View key={z.id} style={[styles.zone, { left: px.left + 4, top: px.top + 4, backgroundColor: theme.border }]} />
          );
        })}
        {peerPx ? (
          <View style={[styles.dotWrap, { left: peerPx.left, top: peerPx.top }]}>
            <View style={[styles.dot, { backgroundColor: theme.amber, shadowColor: theme.amber }]} />
          </View>
        ) : null}
        <View style={[styles.dotWrap, { left: selfPx.left, top: selfPx.top }]}>
          <View style={[styles.dot, { backgroundColor: theme.cyan, width: 14, height: 14, borderRadius: 7 }]} />
        </View>
      </View>
      <View style={styles.legend}>
        <Legend color={theme.cyan} label={`You · ${self.zone}`} />
        <Legend color={theme.amber} label={peer ? peerLabel : 'No peer ping'} />
      </View>
      {proximity ? (
        <View style={styles.stats}>
          <Stat theme={theme} icon="navigate" value={proximity.headingLabel} hint="relative heading" />
          <Stat theme={theme} icon="map" value={proximity.zone} hint={proximity.zoneHint} />
          <Stat
            theme={theme}
            icon={proximity.inWptRange ? 'radio' : proximity.inMeetRange ? 'walk' : 'notifications'}
            value={proximity.inWptRange ? 'Coil range' : proximity.inMeetRange ? 'Meet range' : proximity.band}
            hint={`ETA ~${proximity.etaMin} min`}
          />
        </View>
      ) : (
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 8 }}>
          Waiting for a request ping. Donors only see zone, rounded range and heading — not a street pin.
        </Text>
      )}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

function Stat({
  theme,
  icon,
  value,
  hint,
}: {
  theme: ThemeColors;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  hint: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <Ionicons name={icon} size={12} color={theme.cyan} />
        <Text style={{ color: theme.text, fontSize: 12, fontWeight: '800' }} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Text style={{ color: theme.textDim, fontSize: 10 }} numberOfLines={1}>
        {hint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: 1, padding: 12 },
  captionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  canvas: {
    height: H,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 999,
    left: '50%',
    top: '50%',
  },
  zone: { position: 'absolute', width: 6, height: 6, borderRadius: 3, opacity: 0.55 },
  dotWrap: { position: 'absolute', width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#071018' },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 10 },
});
