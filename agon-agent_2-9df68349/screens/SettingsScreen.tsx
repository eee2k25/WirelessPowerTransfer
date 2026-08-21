import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../lib/AppContext';
import { Btn, Card, SectionTitle } from '../components/ui';
import { VehicleRole } from '../lib/types';
import { confirmAction } from '../lib/confirm';
import { THEME_OPTIONS, ThemeColors } from '../lib/theme';

export default function SettingsScreen() {
  const nav = useNavigation<any>();
  const {
    theme,
    themeMode,
    setThemeMode,
    settings,
    updateSettings,
    setRole,
    linkStatus,
    connectEsp32,
    disconnectEsp32,
    clearHistory,
    logs,
  } = useApp();
  const [id, setId] = useState(settings.vehicleId);
  const [name, setName] = useState(settings.vehicleName);
  const [dev, setDev] = useState(settings.esp32Device);

  const saveProfile = () =>
    updateSettings({
      vehicleId: id.trim() || settings.vehicleId,
      vehicleName: name.trim() || settings.vehicleName,
      esp32Device: dev.trim() || settings.esp32Device,
    });

  const switchRole = (r: VehicleRole) => {
    setRole(r);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
          <Text style={[styles.h1, { color: theme.text }]}>Settings</Text>

          <SectionTitle theme={theme} title="Vehicle profile" />
          <Card theme={theme}>
            <Label theme={theme} text="Vehicle ID" />
            <Field theme={theme} value={id} onChange={setId} />
            <Label theme={theme} text="Display name" />
            <Field theme={theme} value={name} onChange={setName} />
            <Label theme={theme} text="ESP32 device" />
            <Field theme={theme} value={dev} onChange={setDev} />
            <Btn theme={theme} title="Save profile" icon="save" style={{ marginTop: 8 }} onPress={saveProfile} />
          </Card>

          <SectionTitle theme={theme} title="Vehicle role" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn theme={theme} title="DONOR EV" variant={settings.role === 'DONOR' ? 'amber' : 'ghost'} style={{ flex: 1 }} onPress={() => switchRole('DONOR')} />
            <Btn theme={theme} title="RECEIVER EV" variant={settings.role === 'RECEIVER' ? 'primary' : 'ghost'} style={{ flex: 1 }} onPress={() => switchRole('RECEIVER')} />
          </View>
          <Btn theme={theme} title="Change role on launch screen" variant="ghost" style={{ marginTop: 8 }} onPress={() => nav.getParent()?.navigate('Role')} />

          <SectionTitle theme={theme} title="Appearance" hint={themeMode === 'dark' ? 'Dark selected' : 'Day selected'} />
          <View style={{ gap: 10 }}>
            {THEME_OPTIONS.map((option) => (
              <ThemeOptionCard
                key={option.value}
                theme={theme}
                option={option}
                selected={themeMode === option.value}
                onPress={() => setThemeMode(option.value)}
              />
            ))}
          </View>

          <SectionTitle theme={theme} title="Connection" hint={linkStatus} />
          <Card theme={theme}>
            <RowSwitch theme={theme} label="Bluetooth BLE (primary)" value={settings.bleEnabled} on={(v) => updateSettings({ bleEnabled: v })} />
            <RowSwitch theme={theme} label="Wi-Fi (optional)" value={settings.wifiEnabled} on={(v) => updateSettings({ wifiEnabled: v })} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Btn theme={theme} title="Connect ESP32" icon="bluetooth" style={{ flex: 1 }} onPress={() => connectEsp32()} />
              <Btn theme={theme} title="Disconnect" variant="ghost" style={{ flex: 1 }} onPress={() => disconnectEsp32()} />
            </View>
          </Card>

          <SectionTitle theme={theme} title="Location & notify" />
          <Card theme={theme}>
            <RowSwitch theme={theme} label="Location tracking (notify only)" value={settings.locationTracking} on={(v) => updateSettings({ locationTracking: v })} />
            <RowSwitch theme={theme} label="Hide exact pin from peers" value={settings.hideExactLocation} on={(v) => updateSettings({ hideExactLocation: v })} />
            <NumRow theme={theme} label="Notify radius (m)" value={settings.notifyRadius} on={(n) => updateSettings({ notifyRadius: Math.max(30, n) })} step={10} />
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 6, lineHeight: 17 }}>
              Donors are notified with campus zone, rounded range and compass heading. Street-level GPS is never attached to a request.
            </Text>
          </Card>

          <SectionTitle theme={theme} title="Limits" />
          <Card theme={theme}>
            <NumRow theme={theme} label="Available power (W)" value={settings.availablePower} on={(n) => updateSettings({ availablePower: n })} />
            <NumRow theme={theme} label="Max transfer duration (min)" value={settings.maxTransferDuration} on={(n) => updateSettings({ maxTransferDuration: n })} />
            <NumRow theme={theme} label="Minimum donor battery (%)" value={settings.minDonorBattery} on={(n) => updateSettings({ minDonorBattery: n })} />
            <NumRow theme={theme} label="Low receiver battery (%)" value={settings.lowReceiverBattery} on={(n) => updateSettings({ lowReceiverBattery: n })} />
            <NumRow theme={theme} label="Max voltage (V)" value={settings.maxVoltage} on={(n) => updateSettings({ maxVoltage: n })} step={0.1} />
            <NumRow theme={theme} label="Max current (A)" value={settings.maxCurrent} on={(n) => updateSettings({ maxCurrent: n })} step={0.1} />
            <NumRow theme={theme} label="Max temperature (°C)" value={settings.maxTemp} on={(n) => updateSettings({ maxTemp: n })} />
          </Card>

          <SectionTitle theme={theme} title="App" />
          <Card theme={theme}>
            <RowSwitch theme={theme} label="Notifications" value={settings.notifications} on={(v) => updateSettings({ notifications: v })} />
            <RowSwitch theme={theme} label="Demo Mode" value={settings.demoMode} on={(v) => updateSettings({ demoMode: v })} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Btn
                theme={theme}
                title={settings.units === 'metric' ? 'Units: metric' : 'Units: imperial'}
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => updateSettings({ units: settings.units === 'metric' ? 'imperial' : 'metric' })}
              />
            </View>
          </Card>

          <SectionTitle theme={theme} title="History" />
          <Btn
            theme={theme}
            title="Clear history"
            icon="trash"
            variant="danger"
            onPress={() => confirmAction('Clear history', 'Delete all saved V2V sessions?', 'Clear', clearHistory, true)}
          />

          <SectionTitle theme={theme} title="ESP32 log" />
          <Card theme={theme}>
            {logs.slice(0, 8).map((l, i) => (
              <Text key={i} style={{ color: theme.textDim, fontSize: 11, marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                {l}
              </Text>
            ))}
          </Card>

          <Text style={{ color: theme.textDim, fontSize: 11, marginTop: 18, textAlign: 'center' }}>
            V2V PowerShare · B.Tech EEE · Intelligent Vehicle-to-Vehicle Power Sharing using WPT{`\n`}
            Monitoring interface only — electrical protection stays on hardware.
          </Text>
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ThemeOptionCard({
  theme,
  option,
  selected,
  onPress,
}: {
  theme: ThemeColors;
  option: (typeof THEME_OPTIONS)[number];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.themeCard,
        {
          backgroundColor: theme.card,
          borderColor: selected ? theme.cyan : theme.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.themeHead}>
        <View
          style={[
            styles.themeIcon,
            {
              backgroundColor: selected ? theme.cyanDim : theme.cardAlt,
              borderColor: selected ? theme.cyan : theme.border,
            },
          ]}
        >
          <Ionicons name={option.icon} size={18} color={selected ? theme.cyan : theme.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>{option.label}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 3, lineHeight: 17 }}>{option.description}</Text>
        </View>
        <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? theme.cyan : theme.textDim} />
      </View>
      <View style={styles.swatches}>
        {option.swatches.map((swatch, index) => (
          <View
            key={`${option.value}-${index}`}
            style={[
              styles.swatch,
              {
                backgroundColor: swatch,
                borderColor: option.value === 'day' && index === 0 ? theme.borderStrong : swatch,
              },
            ]}
          />
        ))}
      </View>
      <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '700' }}>
        {selected ? 'Selected theme' : `Switch to ${option.label.toLowerCase()} theme`}
      </Text>
    </Pressable>
  );
}

function Label({ text, theme }: { text: string; theme: ThemeColors }) {
  return <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 6, marginTop: 8 }}>{text}</Text>;
}

function Field({ theme, value, onChange }: { theme: ThemeColors; value: string; onChange: (s: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      returnKeyType="done"
      style={{
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.bg,
        color: theme.text,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontWeight: '700',
      }}
    />
  );
}

function RowSwitch({ theme, label, value, on }: { theme: ThemeColors; label: string; value: boolean; on: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
      <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }}>{label}</Text>
      <Switch value={value} onValueChange={on} trackColor={{ true: theme.cyan, false: theme.border }} thumbColor={theme.bgElevated} />
    </View>
  );
}

function NumRow({
  theme,
  label,
  value,
  on,
  step = 1,
}: {
  theme: ThemeColors;
  label: string;
  value: number;
  on: (n: number) => void;
  step?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 }}>
      <Text style={{ color: theme.text, fontWeight: '600', flex: 1 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text onPress={() => on(Math.max(0, +(value - step).toFixed(2)))} style={{ color: theme.cyan, fontWeight: '900', fontSize: 18 }}>
          −
        </Text>
        <Text style={{ color: theme.text, fontWeight: '800', minWidth: 42, textAlign: 'center' }}>{value}</Text>
        <Text onPress={() => on(+(value + step).toFixed(2))} style={{ color: theme.cyan, fontWeight: '900', fontSize: 18 }}>
          +
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { padding: 16, paddingBottom: 40 },
  h1: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  themeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  themeHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  themeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatches: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  swatch: { flex: 1, height: 22, borderRadius: 999, borderWidth: 1 },
});
