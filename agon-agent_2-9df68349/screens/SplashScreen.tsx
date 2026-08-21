import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../lib/navigation';
import { useApp } from '../lib/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { settings, ready, theme } = useApp();
  const o = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(o, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [o, y]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      if (settings.role) navigation.replace('Main');
      else navigation.replace('Role');
    }, 1600);
    return () => clearTimeout(t);
  }, [ready, settings.role, navigation]);

  return (
    <LinearGradient colors={theme.splash} style={styles.root}>
      <Animated.View style={[styles.center, { opacity: o, transform: [{ translateY: y }] }]}>
        <View style={[styles.badge, { backgroundColor: theme.cyanDim, borderColor: `${theme.cyan}66` }]}>
          <Ionicons name="flash" size={36} color={theme.cyan} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>V2V PowerShare</Text>
        <Text style={[styles.tag, { color: theme.textMuted }]}>Smart Vehicle-to-Vehicle{'\n'}Wireless Energy Sharing</Text>
      </Animated.View>
      <Animated.View style={[styles.foot, { opacity: o }]}>
        <Text style={[styles.footTxt, { color: theme.textDim }]}>INTELLIGENT WPT  ·  ZVS  ·  RIC  ·  ESP32  ·  INA219</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', paddingHorizontal: 28 },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.8 },
  tag: { fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 22, fontWeight: '600' },
  foot: { position: 'absolute', bottom: 48 },
  footTxt: { fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
});
