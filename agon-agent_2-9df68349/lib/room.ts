import { VehicleRole } from './types';

export type RoomStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface RoomProfile {
  id: string;
  name: string;
  role: VehicleRole;
}

export interface RoomPeer extends RoomProfile {
  connectedAt: number;
}

export interface RoomMessage {
  type: string;
  payload?: unknown;
  from?: RoomProfile;
  code?: string;
  peers?: RoomProfile[];
}

type RoomListener = (message: RoomMessage) => void;
type StatusListener = (status: RoomStatus, detail?: string) => void;

function defaultUrl() {
  const configured = (globalThis as { process?: { env?: Record<string, string> } }).process?.env?.EXPO_PUBLIC_WPT_WS_URL;
  if (configured) return configured;
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.hostname}:8787`;
  }
  return 'ws://localhost:8787';
}

class RoomService {
  private socket: WebSocket | null = null;
  private code: string | null = null;
  private listeners = new Set<RoomListener>();
  private statusListeners = new Set<StatusListener>();

  onMessage(listener: RoomListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStatus(listener: StatusListener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  getCode() {
    return this.code;
  }

  async connect(code: string | undefined, profile: RoomProfile) {
    this.disconnect();
    this.setStatus('connecting');
    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(defaultUrl());
      this.socket = socket;
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'join', code: code?.trim().toUpperCase() || undefined, profile }));
        resolve();
      };
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as RoomMessage & { code?: string };
          if (message.type === 'joined') {
            this.code = message.code ?? null;
            this.setStatus('connected', this.code ?? undefined);
          }
          this.listeners.forEach((listener) => listener(message));
        } catch {
          this.setStatus('error', 'Invalid room message');
        }
      };
      socket.onerror = () => {
        this.setStatus('error', 'Room server unavailable');
        reject(new Error('Room server unavailable'));
      };
      socket.onclose = () => {
        this.socket = null;
        if (this.code) this.setStatus('disconnected');
      };
    });
  }

  send(type: string, payload?: unknown) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify({ type, payload }));
    return true;
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.code = null;
    this.setStatus('disconnected');
  }

  private setStatus(status: RoomStatus, detail?: string) {
    this.statusListeners.forEach((listener) => listener(status, detail));
  }
}

export const room = new RoomService();