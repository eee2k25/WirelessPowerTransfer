import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, HistoryRecord, normalizeSettings } from './types';

const SETTINGS_KEY = 'v2v.settings.v1';
const HISTORY_KEY = 'v2v.history.v1';

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return normalizeSettings();
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return normalizeSettings();
  }
}

export async function saveSettings(s: AppSettings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(s)));
}

export async function loadHistory(): Promise<HistoryRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveHistory(rows: HistoryRecord[]) {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(rows));
}
