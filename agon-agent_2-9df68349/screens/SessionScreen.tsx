import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../lib/AppContext';
import { Btn, Card, Chip, Empty, Metric, SectionTitle } from '../components/ui';
import { PowerFlow } from '../components/PowerFlow';
import { LiveGraph, GraphKey } from '../components/LiveGraph';
import { SafetyNote } from '../components/StatusStrip';
import { formatDuration, formatWh } from '../lib/demo';
import { confirmAction } from '../lib/confirm';
import { ProximityMap } from '../components/ProximityMap';

export default function SessionScreen() {
  const {
    theme,
    session,
    wpt,
    telemetry,
    points,
    runSystemCheck,
    startWpt,
    stopWpt,
    emergencyStop,
    lastSummary,
    dismissSummary,
    injectFault,
    settings,
    selfFix,
    peerXY,
    proximity,
  } = useApp();
  const [windowMin, setWindowMin] = useState(5);
  const [graph, setGraph] = useState<GraphKey>('p');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!session && !lastSummary) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
        <Empty
          theme={theme}
          icon="git-network-outline"
          title="No active V2V session"
          body="Match a Donor and Receiver from Find to run system check, start WPT and watch live INA219 data."
        />
      </SafeAreaView>
    );
  }

  const elapsed = session?.startTime ? (Date.now() - session.startTime) / 1000 : 0;
  void tick;

  const confirmStart = () => {
    confirmAction('Start WPT', 'Energize ZVS inverter and Tx/Rx resonant coils?', 'START WPT', () => startWpt());
  };
  const confirmStop = () => {
    confirmAction('Stop WPT', 'Stop wireless transfer and close this session?', 'STOP WPT', () => stopWpt());
  };
  const confirmEstop = () => {
    confirmAction('Emergency Stop', 'Send EMERGENCY_STOP to ESP32 and halt the session?', 'EMERGENCY STOP', () => emergencyStop(), true);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Text style={[styles.h1, { color: theme.text }]}>V2V Session</Text>
          <Chip
            theme={theme}
            tone={wpt === 'active' ? 'ok' : wpt === 'emergency' || wpt === 'fault' ? 'fault' : wpt === 'ready' ? 'info' : 'amber'}
            label={session?.status?.toUpperCase() ?? wpt.toUpperCase()}
          />
        </View>

        {session ? (
          <Card theme={theme} accent={theme.cyan} style={{ alignItems: 'center' }}>
            <Text style={{ color: theme.amber, fontWeight: '800' }}>{session.donorName}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.textDim} />
            <Text style={{ color: theme.cyan, fontWeight: '800', letterSpacing: 1 }}>V2V WIRELESS POWER</Text>
            <Ionicons name="chevron-down" size={16} color={theme.textDim} />
            <Text style={{ color: theme.blue, fontWeight: '800' }}>{session.receiverName}</Text>
            <Text style={{ color: theme.textMuted, marginTop: 8, fontSize: 12 }}>
              {session.requestedPower} W · {session.requestedDuration} min · {session.id}
            </Text>
          </Card>
        ) : null}

        {(wpt === 'checking' || wpt === 'ready') && session ? (
          <View style={{ marginTop: 14 }}>
            <SectionTitle theme={theme} title="System check" hint={wpt === 'ready' ? 'SYSTEM READY' : 'Verify path'} />
            <Card theme={theme}>
              {session.checks.map((c) => (
                <View key={c.id} style={styles.check}>
                  <Ionicons name={c.ok ? 'checkmark-circle' : 'close-circle'} size={18} color={c.ok ? theme.green : theme.red} />
                  <Text style={{ color: theme.text, fontWeight: '600', flex: 1 }}>{c.label}</Text>
                </View>
              ))}
              {wpt === 'checking' ? (
                <Btn theme={theme} title="RUN SYSTEM CHECK" icon="shield-checkmark" style={{ marginTop: 10 }} onPress={runSystemCheck} />
              ) : (
                <Text style={{ color: theme.green, fontWeight: '800', marginTop: 8 }}>SYSTEM READY</Text>
              )}
            </Card>
          </View>
        ) : null}

        <SectionTitle theme={theme} title="Meet without a pin" hint={proximity?.headingLabel ?? 'tracking'} />
        <ProximityMap
          theme={theme}
          self={selfFix}
          peer={peerXY}
          proximity={proximity}
          peerLabel={settings.role === 'DONOR' ? session?.receiverName ?? 'Receiver' : session?.donorName ?? 'Donor'}
          hideExact={settings.hideExactLocation}
        />

        <SectionTitle theme={theme} title="WPT control" hint="Commands → ESP32" />
        <View style={{ gap: 8 }}>
          <Btn theme={theme} title="START WPT" icon="play" disabled={wpt !== 'ready'} onPress={confirmStart} />
          <Btn theme={theme} title="STOP WPT" icon="stop" variant="ghost" disabled={wpt !== 'active'} onPress={confirmStop} />
          <Btn theme={theme} title="EMERGENCY STOP" icon="warning" variant="danger" disabled={!session || wpt === 'idle'} onPress={confirmEstop} />
        </View>

        <SectionTitle theme={theme} title="Power-flow path" hint={wpt === 'active' ? 'Energized' : 'Standby'} />
        <PowerFlow theme={theme} active={wpt === 'active'} />

        <SectionTitle theme={theme} title="Live INA219" hint={wpt === 'active' ? `${formatDuration(elapsed)}` : 'idle'} />
        <Card theme={theme} accent={theme.amber}>
          <Text style={styles.blockLab}>DONOR EV</Text>
          <View style={styles.metrics}>
            <Metric theme={theme} label="Voltage" value={telemetry.donorV.toFixed(2)} unit="V" />
            <Metric theme={theme} label="Current" value={telemetry.donorI.toFixed(2)} unit="A" />
            <Metric theme={theme} label="Power" value={telemetry.donorP.toFixed(2)} unit="W" />
          </View>
          <View style={styles.metrics}>
            <Metric theme={theme} label="Battery" value={telemetry.socD.toFixed(1)} unit="%" />
            <Metric theme={theme} label="Temp" value={telemetry.temp.toFixed(1)} unit="°C" />
            <Metric theme={theme} label="Status" value={telemetry.wpt} />
          </View>
        </Card>
        <Card theme={theme} accent={theme.cyan} style={{ marginTop: 10 }}>
          <Text style={styles.blockLab}>WIRELESS TRANSFER</Text>
          <View style={styles.metrics}>
            <Metric theme={theme} label="Tx V" value={telemetry.txV.toFixed(2)} unit="V" color={theme.cyan} />
            <Metric theme={theme} label="Rx V" value={telemetry.rxV.toFixed(2)} unit="V" />
            <Metric theme={theme} label="I xfer" value={telemetry.rxI.toFixed(2)} unit="A" />
          </View>
          <View style={styles.metrics}>
            <Metric theme={theme} label="P xfer" value={telemetry.rxP.toFixed(2)} unit="W" color={theme.blue} />
            <Metric theme={theme} label="Eff" value={telemetry.eff.toFixed(1)} unit="%" color={theme.green} />
            <Metric theme={theme} label="Freq" value={telemetry.freq.toFixed(1)} unit="kHz" />
          </View>
        </Card>
        <Card theme={theme} accent={theme.blue} style={{ marginTop: 10 }}>
          <Text style={styles.blockLab}>RECEIVER EV</Text>
          <View style={styles.metrics}>
            <Metric theme={theme} label="Voltage" value={telemetry.rxV.toFixed(2)} unit="V" />
            <Metric theme={theme} label="Charge I" value={telemetry.rxI.toFixed(2)} unit="A" />
            <Metric theme={theme} label="Charge P" value={telemetry.rxP.toFixed(2)} unit="W" />
          </View>
          <View style={styles.metrics}>
            <Metric theme={theme} label="Battery" value={telemetry.socR.toFixed(1)} unit="%" color={theme.cyan} />
            <Metric theme={theme} label="Temp" value={telemetry.rxTemp.toFixed(1)} unit="°C" />
            <Metric theme={theme} label="Fault" value={telemetry.fault} color={telemetry.fault === 'NONE' ? theme.green : theme.red} />
          </View>
        </Card>

        <SectionTitle theme={theme} title="Live graphs" hint="INA219 / demo stream" />
        <View style={styles.tabs}>
          {(['v', 'i', 'p', 'eff'] as GraphKey[]).map((k) => (
            <Pressable
              key={k}
              onPress={() => setGraph(k)}
              style={[styles.tab, { backgroundColor: graph === k ? theme.cyan : theme.card, borderColor: theme.border }]}
            >
              <Text style={{ color: graph === k ? '#071018' : theme.textMuted, fontWeight: '800', fontSize: 12 }}>
                {k === 'v' ? 'Voltage' : k === 'i' ? 'Current' : k === 'p' ? 'Power' : 'Eff'}
              </Text>
            </Pressable>
          ))}
        </View>
        <LiveGraph theme={theme} points={points} kind={graph} windowMin={windowMin} onWindow={setWindowMin} />

        {settings.demoMode ? (
          <Card theme={theme}>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 8, fontWeight: '700' }}>DEMO fault inject</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn theme={theme} title="OT" variant="ghost" style={{ flex: 1 }} onPress={() => injectFault('OT')} />
              <Btn theme={theme} title="OC" variant="ghost" style={{ flex: 1 }} onPress={() => injectFault('OC')} />
              <Btn theme={theme} title="OV" variant="ghost" style={{ flex: 1 }} onPress={() => injectFault('OV')} />
            </View>
          </Card>
        ) : null}

        <View style={{ height: 12 }} />
        <SafetyNote theme={theme} />
        <View style={{ height: 28 }} />
      </ScrollView>

      <Modal visible={!!lastSummary} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.summary, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="checkmark-circle" size={36} color={theme.cyan} />
            <Text style={[styles.sumTitle, { color: theme.text }]}>POWER SHARING COMPLETE</Text>
            {lastSummary ? (
              <>
                <SumRow theme={theme} k="Duration" v={formatDuration(lastSummary.durationSec)} />
                <SumRow theme={theme} k="Energy" v={formatWh(lastSummary.energyWh)} />
                <SumRow theme={theme} k="Average power" v={`${lastSummary.avgPower.toFixed(2)} W`} />
                <SumRow theme={theme} k="Maximum power" v={`${lastSummary.maxPower.toFixed(2)} W`} />
                <SumRow theme={theme} k="Efficiency" v={`${lastSummary.efficiency.toFixed(1)} %`} />
                <SumRow theme={theme} k="Receiver battery" v={`${lastSummary.socBefore.toFixed(0)}% → ${lastSummary.socAfter.toFixed(0)}%`} />
                <SumRow theme={theme} k="Status" v={lastSummary.status} />
              </>
            ) : null}
            <Btn theme={theme} title="Save & close" icon="save" style={{ marginTop: 14 }} onPress={dismissSummary} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SumRow({ k, v, theme }: { k: string; v: string; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 5 }}>
      <Text style={{ color: theme.textMuted, fontWeight: '600' }}>{k}</Text>
      <Text style={{ color: theme.text, fontWeight: '800' }}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { padding: 16, paddingBottom: 40 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  h1: { fontSize: 22, fontWeight: '800' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  blockLab: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#94A3B8', marginBottom: 8 },
  metrics: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  summary: { width: '100%', borderRadius: 20, borderWidth: 1, padding: 20, alignItems: 'center' },
  sumTitle: { fontSize: 16, fontWeight: '800', marginVertical: 10, textAlign: 'center' },
});
