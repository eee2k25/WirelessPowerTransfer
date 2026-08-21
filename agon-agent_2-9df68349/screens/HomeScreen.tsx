import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../lib/AppContext';
import { BatteryRing } from '../components/BatteryRing';
import { Btn, Card, Chip, Metric, SectionTitle } from '../components/ui';
import { SafetyNote, StatusStrip } from '../components/StatusStrip';
import { PowerFlow } from '../components/PowerFlow';

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const {
    theme,
    themeMode,
    toggleTheme,
    settings,
    telemetry,
    linkStatus,
    wpt,
    donorOnline,
    setDonorOnline,
    session,
    incoming,
    proximity,
    selfFix,
    notices,
  } = useApp();
  const role = settings.role;
  const soc = role === 'DONOR' ? telemetry.socD : telemetry.socR;
  const v = role === 'DONOR' ? telemetry.donorV : telemetry.rxV;
  const i = role === 'DONOR' ? telemetry.donorI : telemetry.rxI;
  const p = role === 'DONOR' ? telemetry.donorP : telemetry.rxP;
  const temp = role === 'DONOR' ? telemetry.temp : telemetry.rxTemp;
  const needPower = role === 'RECEIVER' && soc < settings.lowReceiverBattery;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <View>
            <Text style={[styles.kicker, { color: theme.textDim }]}>V2V POWERSHARE</Text>
            <Text style={[styles.h1, { color: theme.text }]}>{settings.vehicleName}</Text>
            <Text style={[styles.id, { color: theme.textMuted }]}>{settings.vehicleId}</Text>
          </View>
          <View style={styles.headActions}>
            {settings.demoMode ? <Chip theme={theme} tone="warn" icon="beaker" label="DEMO MODE" /> : null}
            <Pressable
              onPress={toggleTheme}
              style={({ pressed }) => [
                styles.themePill,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.borderStrong,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <Ionicons name={themeMode === 'dark' ? 'moon' : 'sunny'} size={14} color={theme.cyan} />
              <Text style={[styles.themePillText, { color: theme.text }]}>{themeMode.toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>

        <StatusStrip
          theme={theme}
          role={role}
          link={linkStatus}
          wpt={wpt}
          demo={settings.demoMode}
          donorOnline={donorOnline}
          fault={telemetry.fault}
        />

        <Card theme={theme} accent={theme.blue} style={{ marginBottom: 10 }}>
          <Text style={[styles.mini, { color: theme.textDim }]}>LOCATION FOR NOTIFY ONLY</Text>
          <Text style={[styles.big, { color: theme.text }]}>
            {selfFix.zone} · {settings.locationTracking ? 'tracking on' : 'tracking off'}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
            {proximity
              ? `${proximity.headingLabel} · ${proximity.band} · pin hidden`
              : 'Peers receive zone + heading, never the exact GPS pin.'}
          </Text>
          {notices[0] ? (
            <Text style={{ color: theme.amber, fontSize: 12, marginTop: 6, fontWeight: '700' }}>{notices[0].title}</Text>
          ) : null}
          <Btn theme={theme} title="Open track & notify" icon="navigate" variant="ghost" style={{ marginTop: 10 }} onPress={() => nav.navigate('Track')} />
        </Card>

        <Card theme={theme} accent={role === 'DONOR' ? theme.amber : theme.cyan}>
          <View style={styles.hero}>
            <BatteryRing
              theme={theme}
              pct={soc}
              label={role === 'DONOR' ? 'Donor SoC' : 'Receiver SoC'}
              sub={needPower ? 'Power Required' : role === 'DONOR' ? 'Share ready' : 'Standby'}
            />
            <View style={{ flex: 1, gap: 10 }}>
              <Metric theme={theme} label="Voltage" value={v.toFixed(2)} unit="V" color={theme.cyan} />
              <Metric theme={theme} label="Current" value={i.toFixed(2)} unit="A" color={theme.amber} />
              <Metric theme={theme} label="Power" value={p.toFixed(2)} unit="W" color={theme.blue} />
              <Metric theme={theme} label="Temp" value={temp.toFixed(1)} unit="°C" />
            </View>
          </View>
        </Card>

        <View style={styles.grid}>
          <Card theme={theme} style={{ flex: 1 }}>
            <Text style={[styles.mini, { color: theme.textDim }]}>WHO SUPPLIES</Text>
            <Text style={[styles.big, { color: theme.amber }]}>{role === 'DONOR' ? 'This EV' : session?.donorName ?? '—'}</Text>
          </Card>
          <Card theme={theme} style={{ flex: 1 }}>
            <Text style={[styles.mini, { color: theme.textDim }]}>WHO RECEIVES</Text>
            <Text style={[styles.big, { color: theme.cyan }]}>{role === 'RECEIVER' ? 'This EV' : session?.receiverName ?? '—'}</Text>
          </Card>
        </View>
        <View style={styles.grid}>
          <Card theme={theme} style={{ flex: 1 }}>
            <Text style={[styles.mini, { color: theme.textDim }]}>TRANSFER POWER</Text>
            <Text style={[styles.big, { color: theme.text }]}>{wpt === 'active' ? `${telemetry.rxP.toFixed(2)} W` : '0.00 W'}</Text>
          </Card>
          <Card theme={theme} style={{ flex: 1 }}>
            <Text style={[styles.mini, { color: theme.textDim }]}>SYSTEM SAFE</Text>
            <Text style={[styles.big, { color: telemetry.fault === 'NONE' ? theme.green : theme.red }]}>
              {telemetry.fault === 'NONE' ? 'YES' : telemetry.fault}
            </Text>
          </Card>
        </View>

        {role === 'DONOR' ? (
          <>
            <SectionTitle theme={theme} title="Donor availability" hint={donorOnline ? 'Sharing enabled' : 'Hidden from receivers'} />
            <Card theme={theme}>
              <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 10 }}>
                {donorOnline ? 'AVAILABLE FOR POWER SHARING' : 'Currently offline'}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 12 }}>
                Available {settings.availablePower} W · max {settings.maxTransferDuration} min · min battery {settings.minDonorBattery}%
              </Text>
              <Btn
                theme={theme}
                title={donorOnline ? 'GO OFFLINE' : 'GO ONLINE'}
                icon={donorOnline ? 'cloud-offline' : 'cloud-done'}
                variant={donorOnline ? 'ghost' : 'amber'}
                onPress={() => setDonorOnline(!donorOnline)}
              />
              {incoming.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: theme.amber, fontWeight: '800', marginBottom: 6 }}>
                    {incoming.length} pending request{incoming.length > 1 ? 's' : ''}
                  </Text>
                  <Btn theme={theme} title="Review requests" icon="mail-open" variant="primary" onPress={() => nav.navigate('Find')} />
                </View>
              ) : null}
            </Card>
          </>
        ) : (
          <>
            <SectionTitle theme={theme} title="Need energy?" hint={needPower ? 'Battery below threshold' : 'Find a donor'} />
            <Btn
              theme={theme}
              title="FIND NEARBY DONORS"
              icon="locate"
              onPress={() => nav.navigate('Find')}
            />
          </>
        )}

        {session ? (
          <View style={{ marginTop: 14 }}>
            <Btn theme={theme} title="Open live session" icon="pulse" variant="blue" onPress={() => nav.navigate('Session')} />
          </View>
        ) : null}

        <SectionTitle theme={theme} title="Case-1 power path" hint="RIC wireless" />
        <PowerFlow theme={theme} active={wpt === 'active'} />

        <View style={{ height: 10 }} />
        <SafetyNote theme={theme} />
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { padding: 16, paddingBottom: 40 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headActions: { alignItems: 'flex-end', gap: 8 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  h1: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  id: { fontSize: 12, marginTop: 2 },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  themePillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  hero: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  grid: { flexDirection: 'row', gap: 10, marginTop: 10 },
  mini: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  big: { fontSize: 15, fontWeight: '800', marginTop: 4 },
});
