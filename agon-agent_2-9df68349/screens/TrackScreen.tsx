import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../lib/AppContext';
import { Btn, Card, Chip, Empty, SectionTitle } from '../components/ui';
import { ProximityMap } from '../components/ProximityMap';

export default function TrackScreen() {
  const nav = useNavigation<any>();
  const {
    theme,
    settings,
    selfFix,
    peerXY,
    proximity,
    incoming,
    outgoing,
    session,
    notices,
    dismissNotice,
    clearNotices,
    acceptRequest,
    donorOnline,
  } = useApp();

  const peerLabel =
    settings.role === 'DONOR'
      ? incoming[0]?.receiverName ?? session?.receiverName ?? 'Receiver EV'
      : outgoing?.donorName ?? session?.donorName ?? 'Donor EV';

  const pending = incoming.find((r) => r.status === 'pending');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <FlatList
        data={notices}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.pad}
        ListHeaderComponent={
          <View>
            <View style={styles.head}>
              <View>
                <Text style={[styles.h1, { color: theme.text }]}>Track & Notify</Text>
                <Text style={[styles.sub, { color: theme.textMuted }]}>
                  Location is used only to ping nearby vehicles. Exact coordinates stay off the request.
                </Text>
              </View>
              <Chip
                theme={theme}
                tone={settings.locationTracking ? 'ok' : 'idle'}
                icon="locate"
                label={settings.locationTracking ? 'TRACKING' : 'OFF'}
              />
            </View>

            <ProximityMap
              theme={theme}
              self={selfFix}
              peer={peerXY}
              proximity={proximity}
              peerLabel={peerLabel}
              hideExact={settings.hideExactLocation}
            />

            <Card theme={theme} style={{ marginTop: 12 }} accent={theme.cyan}>
              <Text style={{ color: theme.text, fontWeight: '800', marginBottom: 6 }}>How the Donor is notified</Text>
              <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19 }}>
                When a Receiver sends a request, the Donor gets a notification with zone, rounded range and compass heading — not a map pin. They can drive toward the heading until coil range (~3 m) without ever learning the exact GPS.
              </Text>
              <View style={styles.pills}>
                <Chip theme={theme} tone="info" label={`Radius ${settings.notifyRadius} m`} />
                <Chip theme={theme} tone="amber" label={selfFix.source === 'device' ? 'DEVICE FIX' : 'DEMO CAMPUS'} />
                <Chip theme={theme} tone={settings.hideExactLocation ? 'ok' : 'warn'} label={settings.hideExactLocation ? 'PIN HIDDEN' : 'ZONE ONLY'} />
              </View>
            </Card>

            {pending ? (
              <Card theme={theme} style={{ marginTop: 12 }} accent={theme.amber}>
                <Text style={{ color: theme.amber, fontWeight: '800' }}>LIVE REQUEST PING</Text>
                <Text style={{ color: theme.text, marginTop: 6, fontWeight: '700' }}>{pending.receiverName}</Text>
                <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 13 }}>
                  {pending.headingLabel} · {pending.zone} ({pending.zoneHint}) · {pending.requestedPower} W
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Btn
                    theme={theme}
                    title="ACCEPT"
                    icon="checkmark"
                    style={{ flex: 1 }}
                    onPress={() => {
                      acceptRequest(pending.id);
                      nav.navigate('Session');
                    }}
                  />
                  <Btn theme={theme} title="OPEN FIND" variant="ghost" style={{ flex: 1 }} onPress={() => nav.navigate('Find')} />
                </View>
              </Card>
            ) : null}

            {!pending && settings.role === 'DONOR' && !donorOnline ? (
              <Text style={{ color: theme.orange, marginTop: 12, fontWeight: '700', fontSize: 12 }}>
                Go online on Home to receive proximity notifications from nearby Receivers.
              </Text>
            ) : null}

            <SectionTitle theme={theme} title="Notification inbox" hint={`${notices.length}`} />
          </View>
        }
        ListEmptyComponent={
          <Empty
            theme={theme}
            icon="notifications-off-outline"
            title="No proximity alerts yet"
            body="As Donor: go online. As Receiver: request a nearby Donor. Alerts carry heading and zone only."
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => dismissNotice(item.id)}>
            <Card theme={theme} style={{ marginBottom: 10 }} accent={item.kind === 'request' ? theme.amber : item.kind === 'fault' ? theme.red : theme.cyan}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: theme.text, fontWeight: '800', flex: 1 }}>{item.title}</Text>
                <Ionicons name="close" size={14} color={theme.textDim} />
              </View>
              <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 13 }}>{item.body}</Text>
              <Text style={{ color: theme.textDim, marginTop: 6, fontSize: 11 }}>{new Date(item.at).toLocaleTimeString()}</Text>
            </Card>
          </Pressable>
        )}
        ListFooterComponent={
          notices.length ? (
            <Btn theme={theme} title="Clear inbox" variant="ghost" icon="trash" onPress={clearNotices} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { padding: 16, paddingBottom: 40 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  h1: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 4, lineHeight: 17, maxWidth: 260 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
});
