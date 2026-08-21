import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../lib/AppContext';
import { HistoryRecord } from '../lib/types';
import { Card, Chip, Empty } from '../components/ui';
import { formatDuration, formatWh } from '../lib/demo';

export default function HistoryScreen() {
  const { theme, history } = useApp();
  const [open, setOpen] = useState<HistoryRecord | null>(null);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.head}>
        <Text style={[styles.h1, { color: theme.text }]}>Session History</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]}>{history.length} archived V2V transfers</Text>
      </View>
      <FlatList
        data={history}
        keyExtractor={(h) => h.sessionId}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
        ListEmptyComponent={
          <Empty
            theme={theme}
            icon="time-outline"
            title="No completed sessions"
            body="Finish a WPT transfer to store duration, energy, efficiency and battery delta."
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => setOpen(item)}>
            <Card theme={theme} style={{ marginBottom: 12 }} accent={item.status.includes('Emergency') || item.status === 'Fault' ? theme.red : theme.cyan}>
              <View style={styles.row}>
                <Text style={{ color: theme.text, fontWeight: '800', flex: 1 }}>{item.sessionId}</Text>
                <Chip theme={theme} tone={item.status.includes('Emergency') || item.status === 'Fault' ? 'fault' : 'ok'} label={item.status} />
              </View>
              <Text style={{ color: theme.textMuted, marginTop: 6, fontSize: 13 }}>
                {item.donor} → {item.receiver}
              </Text>
              <Text style={{ color: theme.textDim, marginTop: 4, fontSize: 12 }}>
                {new Date(item.date).toLocaleString()} · {formatDuration(item.durationSec)} · {formatWh(item.energyWh)}
              </Text>
            </Card>
          </Pressable>
        )}
      />

      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable style={styles.modalBg} onPress={() => setOpen(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => undefined}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>Session detail</Text>
            {open ? (
              <>
                <Row k="Session ID" v={open.sessionId} theme={theme} />
                <Row k="Donor" v={open.donor} theme={theme} />
                <Row k="Receiver" v={open.receiver} theme={theme} />
                <Row k="Date" v={new Date(open.date).toLocaleString()} theme={theme} />
                <Row k="Duration" v={formatDuration(open.durationSec)} theme={theme} />
                <Row k="Energy" v={formatWh(open.energyWh)} theme={theme} />
                <Row k="Avg / Max power" v={`${open.avgPower.toFixed(2)} / ${open.maxPower.toFixed(2)} W`} theme={theme} />
                <Row k="Efficiency" v={`${open.efficiency.toFixed(1)} %`} theme={theme} />
                <Row k="Receiver SoC" v={`${open.socBefore.toFixed(0)}% → ${open.socAfter.toFixed(0)}%`} theme={theme} />
                <Row k="Donor SoC" v={`${open.donorSocBefore.toFixed(0)}% → ${open.donorSocAfter.toFixed(0)}%`} theme={theme} />
                <Row k="Faults" v={String(open.faultCount)} theme={theme} />
                <Row k="Status" v={open.status} theme={theme} />
              </>
            ) : null}
            <Pressable onPress={() => setOpen(null)} style={{ marginTop: 14, alignSelf: 'center' }}>
              <Text style={{ color: theme.cyan, fontWeight: '800' }}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ k, v, theme }: { k: string; v: string; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: theme.textMuted, fontWeight: '600', flex: 1 }}>{k}</Text>
      <Text style={{ color: theme.text, fontWeight: '700', flex: 1.4, textAlign: 'right' }}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { paddingHorizontal: 16, paddingTop: 8 },
  h1: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  sheet: { borderRadius: 18, borderWidth: 1, padding: 18 },
});
