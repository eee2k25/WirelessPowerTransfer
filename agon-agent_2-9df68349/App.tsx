import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './lib/AppContext';
import SplashScreen from './screens/SplashScreen';
import RoleScreen from './screens/RoleScreen';
import HomeScreen from './screens/HomeScreen';
import FindScreen from './screens/FindScreen';
import SessionScreen from './screens/SessionScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import TrackScreen from './screens/TrackScreen';
import { RootStackParamList, TabParamList } from './lib/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  const { theme, incoming, session, wpt, settings, notices } = useApp();
  const findBadge = settings.role === 'DONOR' && incoming.some((r) => r.status === 'pending') ? incoming.length : undefined;
  const sessionBadge = session && (wpt === 'active' || wpt === 'ready' || wpt === 'checking') ? '●' : undefined;
  const trackBadge = notices.length ? notices.length : undefined;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bgElevated,
          borderTopColor: theme.border,
          height: 62,
          paddingBottom: 6,
          paddingTop: 5,
        },
        tabBarActiveTintColor: theme.cyan,
        tabBarInactiveTintColor: theme.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: focused ? 'home' : 'home-outline',
            Find: focused ? 'search' : 'search-outline',
            Track: focused ? 'navigate' : 'navigate-outline',
            Session: focused ? 'pulse' : 'pulse-outline',
            History: focused ? 'time' : 'time-outline',
            Settings: focused ? 'settings' : 'settings-outline',
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Find"
        component={FindScreen}
        options={{ tabBarBadge: findBadge, tabBarBadgeStyle: { backgroundColor: theme.amber, color: theme.onAccent, fontSize: 11 } }}
      />
      <Tab.Screen
        name="Track"
        component={TrackScreen}
        options={{ tabBarBadge: trackBadge, tabBarBadgeStyle: { backgroundColor: theme.cyan, color: theme.onAccent, fontSize: 11 } }}
      />
      <Tab.Screen
        name="Session"
        component={SessionScreen}
        options={{ tabBarBadge: sessionBadge, tabBarBadgeStyle: { backgroundColor: theme.cyan, color: theme.onAccent, fontSize: 10, minWidth: 16 } }}
      />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AlertHost() {
  const { alert, dismissAlert, theme } = useApp();
  if (!alert) return null;
  const emergency = /emergency|fault/i.test(alert);
  return (
    <View pointerEvents="box-none" style={styles.alertWrap}>
      <Pressable
        onPress={dismissAlert}
        style={[
          styles.alert,
          {
            backgroundColor: emergency ? theme.red : theme.card,
            borderColor: emergency ? theme.red : theme.amber,
          },
        ]}
      >
        <Ionicons name={emergency ? 'warning' : 'notifications'} size={18} color={emergency ? theme.onAccent : theme.amber} />
        <Text style={{ color: emergency ? theme.onAccent : theme.text, flex: 1, fontWeight: '700', fontSize: 13 }}>{alert}</Text>
        <Ionicons name="close" size={16} color={emergency ? theme.onAccent : theme.textMuted} />
      </Pressable>
    </View>
  );
}

function RootNav() {
  const { ready, dark, theme } = useApp();
  if (!ready) {
    return (
      <View style={[styles.boot, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.cyan} />
      </View>
    );
  }
  const navTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.bg,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      primary: theme.cyan,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Role" component={RoleScreen} />
        <Stack.Screen name="Main" component={Tabs} />
      </Stack.Navigator>
      <AlertHost />
    </NavigationContainer>
  );
}

function AppShell() {
  const { dark } = useApp();
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <RootNav />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  alertWrap: { position: 'absolute', top: 52, left: 12, right: 12, zIndex: 50 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});
