import { Alert, Platform } from 'react-native';

export function confirmAction(title: string, message: string, ok: string, onOk: () => void, destructive = false) {
  if (Platform.OS === 'web') {
    const okd = typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : true;
    if (okd) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: ok, style: destructive ? 'destructive' : 'default', onPress: onOk },
  ]);
}
