import { parseEsp32Frame, serializeCommand } from './parser';
import { LinkStatus, Telemetry } from './types';

export type Esp32Command =
  | 'START_WPT'
  | 'STOP_WPT'
  | 'EMERGENCY_STOP'
  | 'GET_STATUS'
  | 'ACCEPT_REQUEST'
  | 'REJECT_REQUEST'
  | 'CANCEL_REQUEST'
  | 'END_SESSION';

export type TelemetryListener = (t: Telemetry) => void;
export type StatusListener = (s: LinkStatus, detail?: string) => void;
export type LogListener = (line: string) => void;

/**
 * Central BLE/Wi-Fi communication layer.
 * Screens never talk to hardware directly.
 * Demo mode is injected via setDemoSink so protocol can later swap to real BLE.
 */
class ESP32CommunicationService {
  private status: LinkStatus = 'disconnected';
  private deviceName = 'ESP32-V2V-WPT';
  private lastTelemetry: Telemetry | null = null;
  private telemetryListeners = new Set<TelemetryListener>();
  private statusListeners = new Set<StatusListener>();
  private logListeners = new Set<LogListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private demo = true;
  private commandHandler: ((cmd: Esp32Command, raw: string) => void) | null = null;

  setDemoMode(on: boolean) {
    this.demo = on;
  }

  isDemo() {
    return this.demo;
  }

  getStatus() {
    return this.status;
  }

  getDeviceName() {
    return this.deviceName;
  }

  onTelemetry(fn: TelemetryListener) {
    this.telemetryListeners.add(fn);
    return () => this.telemetryListeners.delete(fn);
  }

  onStatus(fn: StatusListener) {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  onLog(fn: LogListener) {
    this.logListeners.add(fn);
    return () => this.logListeners.delete(fn);
  }

  setCommandHandler(fn: ((cmd: Esp32Command, raw: string) => void) | null) {
    this.commandHandler = fn;
  }

  private setStatus(s: LinkStatus, detail?: string) {
    this.status = s;
    this.statusListeners.forEach((l) => l(s, detail));
  }

  private log(line: string) {
    this.logListeners.forEach((l) => l(line));
  }

  async scan(): Promise<string[]> {
    this.log('Scanning BLE / Wi-Fi for ESP32-V2V-WPT…');
    await wait(600);
    if (this.demo) {
      return ['ESP32-V2V-WPT', 'ESP32-V2V-LAB'];
    }
    return ['ESP32-V2V-WPT'];
  }

  async connect(name = 'ESP32-V2V-WPT') {
    this.deviceName = name;
    this.setStatus('connecting', name);
    this.log(`Connecting to ${name} via BLE…`);
    await wait(700);
    this.setStatus('connected', name);
    this.log(`Linked ${name} · INA219 stream ready`);
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    return true;
  }

  async disconnect() {
    this.setStatus('disconnected');
    this.log('ESP32 disconnected');
  }

  ingestRaw(raw: string) {
    try {
      const t = parseEsp32Frame(raw, this.lastTelemetry ?? undefined);
      this.lastTelemetry = t;
      this.telemetryListeners.forEach((l) => l(t));
    } catch (e) {
      this.log(`Parse error: ${String(e)}`);
    }
  }

  async send(cmd: Esp32Command, extra?: Record<string, string | number>) {
    if (this.status !== 'connected' && !this.demo) {
      this.log(`Cannot send ${cmd} — ESP32 offline`);
      throw new Error('ESP32 not connected');
    }
    const raw = serializeCommand(cmd, extra);
    this.log(`TX → ${raw}`);
    this.commandHandler?.(cmd, raw);
    return raw;
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.setStatus('error', 'Link lost');
    this.log('Link lost — retrying in 2s');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.deviceName).catch(() => this.scheduleReconnect());
    }, 2000);
  }
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const esp32 = new ESP32CommunicationService();
