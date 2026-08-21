export type VehicleRole = 'DONOR' | 'RECEIVER';

export type LinkStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type DonorPresence = 'offline' | 'online' | 'busy';

export type WptState =
  | 'idle'
  | 'checking'
  | 'ready'
  | 'active'
  | 'stopping'
  | 'completed'
  | 'fault'
  | 'emergency';

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';

export type SessionStatus =
  | 'matching'
  | 'checking'
  | 'ready'
  | 'active'
  | 'completed'
  | 'fault'
  | 'emergency'
  | 'cancelled';

export type FaultLevel = 'none' | 'warning' | 'fault' | 'emergency';

export interface Telemetry {
  donorV: number;
  donorI: number;
  donorP: number;
  rxV: number;
  rxI: number;
  rxP: number;
  txV: number;
  temp: number;
  rxTemp: number;
  freq: number;
  eff: number;
  socD: number;
  socR: number;
  wpt: 'ON' | 'OFF';
  fault: string;
}

export interface NearbyDonor {
  id: string;
  name: string;
  battery: number;
  availablePower: number;
  distance: number;
  status: 'available' | 'busy' | 'offline';
  voltage: number;
  temp: number;
  zone: string;
  zoneHint: string;
  bearing: string;
  headingLabel: string;
}

export interface PowerRequest {
  id: string;
  receiverId: string;
  receiverName: string;
  receiverBattery: number;
  donorId: string;
  donorName: string;
  donorBattery: number;
  requestedPower: number;
  requestedDuration: number;
  distance: number;
  status: RequestStatus;
  createdAt: number;
  zone: string;
  zoneHint: string;
  headingLabel: string;
  bearing: string;
  band: string;
}

export interface AppNotice {
  id: string;
  title: string;
  body: string;
  at: number;
  kind: 'request' | 'match' | 'proximity' | 'fault' | 'info';
  requestId?: string;
}

export interface CheckItem {
  id: string;
  label: string;
  ok: boolean;
}

export interface V2VSession {
  id: string;
  donorId: string;
  donorName: string;
  receiverId: string;
  receiverName: string;
  requestedPower: number;
  requestedDuration: number;
  startTime?: number;
  endTime?: number;
  status: SessionStatus;
  energyWh: number;
  avgPower: number;
  maxPower: number;
  efficiency: number;
  socBefore: number;
  socAfter: number;
  donorSocBefore: number;
  donorSocAfter: number;
  faultCount: number;
  faults: string[];
  checks: CheckItem[];
}

export interface HistoryRecord {
  sessionId: string;
  donor: string;
  receiver: string;
  date: number;
  durationSec: number;
  energyWh: number;
  avgPower: number;
  maxPower: number;
  efficiency: number;
  faultCount: number;
  status: string;
  socBefore: number;
  socAfter: number;
  donorSocBefore: number;
  donorSocAfter: number;
}

export interface GraphPoint {
  t: number;
  v: number;
  i: number;
  p: number;
  eff: number;
}

export interface AppSettings {
  vehicleId: string;
  vehicleName: string;
  role: VehicleRole | null;
  bleEnabled: boolean;
  wifiEnabled: boolean;
  esp32Device: string;
  maxVoltage: number;
  maxCurrent: number;
  maxTemp: number;
  minDonorBattery: number;
  lowReceiverBattery: number;
  notifications: boolean;
  darkMode: boolean;
  units: 'metric' | 'imperial';
  demoMode: boolean;
  availablePower: number;
  maxTransferDuration: number;
  locationTracking: boolean;
  notifyRadius: number;
  hideExactLocation: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  vehicleId: 'EV-8841',
  vehicleName: 'Campus EV-01',
  role: null,
  bleEnabled: true,
  wifiEnabled: false,
  esp32Device: 'ESP32-V2V-WPT',
  maxVoltage: 14.5,
  maxCurrent: 2.5,
  maxTemp: 55,
  minDonorBattery: 40,
  lowReceiverBattery: 25,
  notifications: true,
  darkMode: true,
  units: 'metric',
  demoMode: true,
  availablePower: 15,
  maxTransferDuration: 30,
  locationTracking: true,
  notifyRadius: 250,
  hideExactLocation: true,
};

export const EMPTY_TELEMETRY: Telemetry = {
  donorV: 12.40,
  donorI: 0.02,
  donorP: 0.25,
  rxV: 11.20,
  rxI: 0.01,
  rxP: 0.11,
  txV: 0.4,
  temp: 31.2,
  rxTemp: 29.4,
  freq: 0,
  eff: 0,
  socD: 82,
  socR: 18,
  wpt: 'OFF',
  fault: 'NONE',
};
