import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../lib/navigation';
import { useApp } from '../lib/AppContext';
import { VehicleRole } from '../lib/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Role'>;

export default function RoleScreen({ navigation }: Props) {
  const { theme, setRole, settings } = useApp();
  const pick = (r: VehicleRole) => {
    setRole(r);
    navigation.replace('Main');
  };
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
      <Text style={[styles.kicker, { color: theme.cyan }]}>V2V POWERSHARE</Text>
      <Text style={[styles.h1, { color: theme.text }]}>Select Vehicle Role</Text>
      <Text style={[styles.sub, { color: theme.textMuted }]}>
        Donor vehicles share surplus energy. Receiver vehicles request a wireless transfer over RIC coils.
      </Text>

      <Pressable
        onPress={() => pick('DONOR')}
        style={({ pressed }) => [styles.card, { backgroundColor: theme.card, borderColor: theme.amber, opacity: pressed ? 0.88 : 1 }]}
      >
        <View style={[styles.icon, { backgroundColor: theme.amberDim }]}>
          <Ionicons name="flash" size={28} color={theme.amber} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.role, { color: theme.text }]}>DONOR EV</Text>
          <Text style={[styles.desc, { color: theme.textMuted }]}>I want to share power</Text>
          <Text style={[styles.tiny, { color: theme.textDim }]}>Go online · accept requests · supply Tx coil</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.amber} />
      </Pressable>

      <Pressable
        onPress={() => pick('RECEIVER')}
        style={({ pressed }) => [styles.card, { backgroundColor: theme.card, borderColor: theme.cyan, opacity: pressed ? 0.88 : 1 }]}
      >
        <View style={[styles.icon, { backgroundColor: theme.cyanDim }]}>
          <Ionicons name="battery-charging" size={28} color={theme.cyan} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.role, { color: theme.text }]}>RECEIVER EV</Text>
          <Text style={[styles.desc, { color: theme.textMuted }]}>I need power</Text>
          <Text style={[styles.tiny, { color: theme.textDim }]}>Find nearby donors · request · charge via Rx coil</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.cyan} />
      </Pressable>

      {settings.demoMode ? (
        <Text style={[styles.demo, { color: theme.orange }]}>DEMO MODE enabled — full flow works without hardware</Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 22 },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 2, marginTop: 12 },
  h1: { fontSize: 28, fontWeight: '800', marginTop: 8, letterSpacing: -0.6 },
  sub: { fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 28 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  icon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  role: { fontSize: 18, fontWeight: '800', letterSpacing: 0.4 },
  desc: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  tiny: { fontSize: 11, marginTop: 4 },
  demo: { marginTop: 18, textAlign: 'center', fontSize: 12, fontWeight: '700' },
});
