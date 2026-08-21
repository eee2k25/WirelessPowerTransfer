import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../lib/AppContext';
import { NearbyDonor } from '../lib/types';
import { Btn, Card, Chip, Empty } from '../components/ui';

export default function FindScreen() {
  const nav = useNavigation<any>();
  const {
    theme,
    settings,
    donors,
    scanDonors,
    sendRequest,
    cancelRequest,
    outgoing,
    incoming,
    acceptRequest,
    rejectRequest,
    telemetry,
    session,
  } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [picked, setPicked] = useState<NearbyDonor | null>(null);
  const [power, setPower] = useState('12');
  const [mins, setMins] = useState('30');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    scanDonors();
    setTimeout(() => setRefreshing(false), 600);
  }, [scanDonors]);

  if (settings.role === 'DONOR') {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
        <View style={styles.head}>
          <Text style={[styles.h1, { color: theme.text }]}>Incoming Requests</Text>
          <Text style={[styles.sub, { color: theme.textMuted }]}>Receivers asking this Donor EV for WPT</Text>
        </View>
        <FlatList
          data={incoming}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <Empty
              theme={theme}
              icon="mail-unread-outline"
              title="No power requests"
              body="Go online from Home. In DEMO MODE a nearby Receiver EV will request shortly."
            />
          }
          renderItem={({ item }) => (
            <Card theme={theme} accent={theme.amber} style={{ marginBottom: 12 }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{item.receiverName}</Text>
                <Chip theme={theme} tone="warn" label={item.status.toUpperCase()} />
              </View>
              <Text style={{ color: theme.textMuted, marginTop: 6, fontSize: 13 }}>
                Receiver battery {item.receiverBattery.toFixed(0)}% · {item.requestedPower} W · {item.requestedDuration} min
              </Text>
              <Text style={{ color: theme.cyan, marginTop: 6, fontSize: 12, fontWeight: '700' }}>
                {item.headingLabel} · {item.zone} · {item.band}
              </Text>
              <Text style={{ color: theme.textDim, marginTop: 3, fontSize: 11 }}>
                Exact pin hidden · {item.zoneHint} · use heading to close
              </Text>
              {item.status === 'pending' ? (
                <View style={styles.rowBtns}>
                  <Btn theme={theme} title="ACCEPT" icon="checkmark" style={{ flex: 1 }} onPress={() => { acceptRequest(item.id); nav.navigate('Session'); }} />
                  <Btn theme={theme} title="REJECT" icon="close" variant="ghost" style={{ flex: 1 }} onPress={() => rejectRequest(item.id)} />
                </View>
              ) : null}
            </Card>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.head}>
        <View>
          <Text style={[styles.h1, { color: theme.text }]}>Nearby Donors</Text>
          <Text style={[styles.sub, { color: theme.orange }]}>DEMO NETWORK · simulated discovery</Text>
        </View>
        <Chip theme={theme} tone="info" icon="navigate" label={`${donors.length} found`} />
      </View>

      {outgoing && outgoing.status === 'pending' ? (
        <Card theme={theme} accent={theme.cyan} style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <Text style={{ color: theme.cyan, fontWeight: '800' }}>REQUEST SENT</Text>
          <Text style={{ color: theme.text, marginTop: 4 }}>Waiting for {outgoing.donorName}…</Text>
          <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
            {outgoing.requestedPower} W · {outgoing.requestedDuration} min
          </Text>
          <Btn theme={theme} title="CANCEL REQUEST" icon="close-circle" variant="ghost" style={{ marginTop: 10 }} onPress={cancelRequest} />
        </Card>
      ) : null}

      {outgoing?.status === 'accepted' || session ? (
        <Card theme={theme} accent={theme.green} style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <Text style={{ color: theme.green, fontWeight: '800' }}>MATCHED</Text>
          <Text style={{ color: theme.text, marginTop: 4 }}>V2V session created. Continue to system check.</Text>
          <Btn theme={theme} title="Open session" icon="pulse" style={{ marginTop: 10 }} onPress={() => nav.navigate('Session')} />
        </Card>
      ) : null}

      <FlatList
        data={donors}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => {
          const blocked = item.battery < settings.minDonorBattery;
          return (
            <Card theme={theme} accent={item.status === 'available' ? theme.cyan : theme.border} style={{ marginBottom: 12 }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
                <Chip
                  theme={theme}
                  tone={item.status === 'available' ? 'ok' : item.status === 'busy' ? 'warn' : 'idle'}
                  label={item.status.toUpperCase()}
                />
              </View>
              <View style={styles.meta}>
                <Meta icon="battery-half" text={`${item.battery}%`} theme={theme} />
                <Meta icon="flash" text={`${item.availablePower} W`} theme={theme} />
                <Meta icon="navigate" text={item.headingLabel} theme={theme} />
                <Meta icon="map" text={item.zone} theme={theme} />
              </View>
              <Text style={{ color: theme.textDim, fontSize: 11, marginTop: 6 }}>
                {item.zoneHint} · pin hidden · {item.distance} m rounded
              </Text>
              {blocked ? (
                <Text style={{ color: theme.orange, fontSize: 12, marginTop: 8, fontWeight: '700' }}>
                  Below minimum donor battery ({settings.minDonorBattery}%)
                </Text>
              ) : null}
              <Btn
                theme={theme}
                title="REQUEST POWER"
                icon="paper-plane"
                disabled={item.status !== 'available' || blocked || !!outgoing}
                style={{ marginTop: 12 }}
                onPress={() => setPicked(item)}
              />
            </Card>
          );
        }}
      />

      <Modal visible={!!picked} transparent animationType="slide" onRequestClose={() => setPicked(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <Pressable style={{ flex: 1 }} onPress={() => setPicked(null)} />
          <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>POWER REQUEST</Text>
            {picked ? (
              <>
                <Text style={{ color: theme.textMuted, marginBottom: 12 }}>
                  {picked.name} · Donor {picked.battery}% · You {telemetry.socR.toFixed(0)}%{'\n'}
                  {picked.headingLabel} · {picked.zone} — Donor is notified with heading, not a GPS pin
                </Text>
                <Text style={[styles.lab, { color: theme.textDim }]}>Requested power (W)</Text>
                <TextInput
                  value={power}
                  onChangeText={setPower}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
                />
                <Text style={[styles.lab, { color: theme.textDim }]}>Requested duration (min)</Text>
                <TextInput
                  value={mins}
                  onChangeText={setMins}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
                />
                <Btn
                  theme={theme}
                  title="SEND POWER REQUEST"
                  icon="send"
                  onPress={() => {
                    sendRequest(picked, Number(power) || 12, Number(mins) || 30);
                    setPicked(null);
                  }}
                />
                <Btn theme={theme} title="Close" variant="ghost" style={{ marginTop: 8 }} onPress={() => setPicked(null)} />
              </>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Meta({ icon, text, theme }: { icon: keyof typeof Ionicons.glyphMap; text: string; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={13} color={theme.textMuted} />
      <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  h1: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 3, fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, borderWidth: 1 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  lab: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 8, fontSize: 16, fontWeight: '700' },
});
