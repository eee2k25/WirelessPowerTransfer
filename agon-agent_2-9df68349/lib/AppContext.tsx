import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import {
  AppNotice,
  AppSettings,
  CheckItem,
  DEFAULT_SETTINGS,
  EMPTY_TELEMETRY,
  GraphPoint,
  HistoryRecord,
  NearbyDonor,
  PowerRequest,
  Telemetry,
  V2VSession,
  VehicleRole,
  WptState,
} from './types';
import { ThemeColors, colors as darkColors, lightColors } from './theme';
import { loadHistory, loadSettings, saveHistory, saveSettings } from './storage';
import { esp32 } from './esp32';
import { room, RoomPeer, RoomStatus } from './room';
import { DEMO_DONORS, clamp, frameFromTelemetry, nextDemoTelemetry } from './demo';
import {
  DEMO_PEER_XY,
  DEMO_SELF,
  LocalXY,
  ProximityInfo,
  SelfFix,
  approach,
  describeProximity,
  jitterXY,
  locationService,
} from './location';

const TICK_MS = 800;

const SEED_HISTORY: HistoryRecord[] = [
  {
    sessionId: 'SES-demo-01',
    donor: 'Donor EV #01',
    receiver: 'Receiver EV #17',
    date: Date.now() - 86400000 * 1.2,
    durationSec: 1680,
    energyWh: 5.42,
    avgPower: 11.6,
    maxPower: 14.9,
    efficiency: 81.4,
    faultCount: 0,
    status: 'Completed',
    socBefore: 18,
    socAfter: 41,
    donorSocBefore: 82,
    donorSocAfter: 76,
  },
  {
    sessionId: 'SES-demo-02',
    donor: 'Donor EV #02',
    receiver: 'Campus EV-01',
    date: Date.now() - 86400000 * 3,
    durationSec: 900,
    energyWh: 2.88,
    avgPower: 11.5,
    maxPower: 13.2,
    efficiency: 78.1,
    faultCount: 1,
    status: 'Stopped',
    socBefore: 22,
    socAfter: 31,
    donorSocBefore: 91,
    donorSocAfter: 88,
  },
];

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 900 + 100)}`;
}

function buildChecks(settings: AppSettings, linked: boolean): CheckItem[] {
  return [
    { id: 'd', label: 'Donor connected', ok: true },
    { id: 'r', label: 'Receiver connected', ok: true },
    { id: 'e', label: 'ESP32 connected', ok: linked },
    { id: 'b', label: 'Battery levels acceptable', ok: true },
    { id: 'w', label: 'WPT ready', ok: true },
    { id: 'f', label: 'No active fault', ok: true },
    { id: 'p', label: 'Requested power within limit', ok: settings.availablePower >= 5 },
    { id: 'l', label: 'Proximity tracking ready (pin hidden)', ok: settings.locationTracking },
  ];
}

interface AppCtx {
  ready: boolean;
  theme: ThemeColors;
  dark: boolean;
  settings: AppSettings;
  updateSettings: (p: Partial<AppSettings>) => void;
  setRole: (r: VehicleRole) => void;
  telemetry: Telemetry;
  linkStatus: ReturnType<typeof esp32.getStatus>;
  logs: string[];
  donorOnline: boolean;
  setDonorOnline: (v: boolean) => void;
  donors: NearbyDonor[];
  incoming: PowerRequest[];
  outgoing: PowerRequest | null;
  session: V2VSession | null;
  wpt: WptState;
  points: GraphPoint[];
  history: HistoryRecord[];
  alert: string | null;
  dismissAlert: () => void;
  scanDonors: () => void;
  sendRequest: (donor: NearbyDonor, power: number, duration: number) => void;
  cancelRequest: () => void;
  acceptRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  runSystemCheck: () => void;
  startWpt: () => Promise<void>;
  stopWpt: () => Promise<void>;
  emergencyStop: () => Promise<void>;
  injectFault: (code: string) => void;
  clearFault: () => void;
  connectEsp32: () => Promise<void>;
  disconnectEsp32: () => Promise<void>;
  clearHistory: () => void;
  lastSummary: HistoryRecord | null;
  dismissSummary: () => void;
  selfFix: SelfFix;
  peerXY: LocalXY | null;
  proximity: ProximityInfo | null;
  notices: AppNotice[];
  dismissNotice: (id: string) => void;
  clearNotices: () => void;
  roomStatus: RoomStatus;
  roomCode: string | null;
  roomPeer: RoomPeer | null;
  connectRoom: (code?: string) => Promise<void>;
  leaveRoom: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [telemetry, setTelemetry] = useState<Telemetry>({ ...EMPTY_TELEMETRY });
  const [linkStatus, setLinkStatus] = useState(esp32.getStatus());
  const [logs, setLogs] = useState<string[]>(['V2V PowerShare ready']);
  const [donorOnline, setDonorOnline] = useState(false);
  const [donors, setDonors] = useState<NearbyDonor[]>(DEMO_DONORS);
  const [incoming, setIncoming] = useState<PowerRequest[]>([]);
  const [outgoing, setOutgoing] = useState<PowerRequest | null>(null);
  const [session, setSession] = useState<V2VSession | null>(null);
  const [wpt, setWpt] = useState<WptState>('idle');
  const [points, setPoints] = useState<GraphPoint[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [alert, setAlert] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<HistoryRecord | null>(null);
  const [selfFix, setSelfFix] = useState<SelfFix>(locationService.getSelf());
  const [peerXY, setPeerXY] = useState<LocalXY | null>(null);
  const [proximity, setProximity] = useState<ProximityInfo | null>(null);
  const [notices, setNotices] = useState<AppNotice[]>([]);
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('disconnected');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomPeer, setRoomPeer] = useState<RoomPeer | null>(null);

  const settingsRef = useRef(settings);
  const telemetryRef = useRef(telemetry);
  const sessionRef = useRef(session);
  const wptRef = useRef(wpt);
  const energyRef = useRef(0);
  const powerSumRef = useRef(0);
  const powerNRef = useRef(0);
  const maxPRef = useRef(0);
  const faultNRef = useRef(0);
  const pendingFault = useRef<string | null>(null);
  const demoReqTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const acceptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProxBand = useRef<string>('');
  const peerXYRef = useRef<LocalXY | null>(null);
  const incomingRef = useRef<PowerRequest[]>([]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  useEffect(() => {
    wptRef.current = wpt;
  }, [wpt]);
  useEffect(() => {
    peerXYRef.current = peerXY;
  }, [peerXY]);
  useEffect(() => {
    incomingRef.current = incoming;
  }, [incoming]);

  const pushLog = useCallback((line: string) => {
    const stamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`${stamp}  ${line}`, ...prev].slice(0, 40));
  }, []);

  const pushNotice = useCallback((n: Omit<AppNotice, 'id' | 'at'>) => {
    const row: AppNotice = { ...n, id: uid('NTC'), at: Date.now() };
    setNotices((prev) => [row, ...prev].slice(0, 24));
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [s, h] = await Promise.all([loadSettings(), loadHistory()]);
      if (!mounted) return;
      setSettings(s);
      setHistory(h.length ? h : SEED_HISTORY);
      setTelemetry((t) => ({
        ...t,
        socD: s.role === 'DONOR' ? 82 : 82,
        socR: s.role === 'RECEIVER' ? 18 : 18,
      }));
      esp32.setDemoMode(s.demoMode);
      setReady(true);
      locationService.setTracking(s.locationTracking);
      if (s.locationTracking) locationService.startDeviceIfAvailable();
      if (s.demoMode) {
        esp32.connect(s.esp32Device).catch(() => undefined);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const offT = esp32.onTelemetry((t) => setTelemetry(t));
    const offS = esp32.onStatus((st) => setLinkStatus(st));
    const offL = esp32.onLog(pushLog);
    return () => {
      offT();
      offS();
      offL();
    };
  }, [pushLog]);

  const persistSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    saveSettings(next).catch(() => undefined);
    esp32.setDemoMode(next.demoMode);
    locationService.setTracking(next.locationTracking);
    if (next.locationTracking) locationService.startDeviceIfAvailable();
    else locationService.stopDevice();
  }, []);

  const updateSettings = useCallback(
    (p: Partial<AppSettings>) => {
      persistSettings({ ...settingsRef.current, ...p });
    },
    [persistSettings],
  );

  const setRole = useCallback(
    (r: VehicleRole) => {
      persistSettings({ ...settingsRef.current, role: r });
      setOutgoing(null);
      setIncoming([]);
      setSession(null);
      setWpt('idle');
      setPoints([]);
      setDonorOnline(false);
      setPeerXY(null);
      setProximity(null);
      lastProxBand.current = '';
      setTelemetry((t) => ({
        ...t,
        socD: r === 'DONOR' ? Math.max(t.socD, 70) : t.socD,
        socR: r === 'RECEIVER' ? Math.min(t.socR, 22) : t.socR,
        wpt: 'OFF',
        fault: 'NONE',
      }));
      pushLog(`Role set → ${r} EV`);
    },
    [persistSettings, pushLog],
  );

  const finalizeSession = useCallback(
    (status: HistoryRecord['status'], faultExtra?: string) => {
      const sess = sessionRef.current;
      const tel = telemetryRef.current;
      if (!sess) return;
      const end = Date.now();
      const start = sess.startTime ?? end;
      const durationSec = Math.max(1, Math.round((end - start) / 1000));
      const avg = powerNRef.current ? powerSumRef.current / powerNRef.current : 0;
      const rec: HistoryRecord = {
        sessionId: sess.id,
        donor: sess.donorName,
        receiver: sess.receiverName,
        date: start,
        durationSec,
        energyWh: +energyRef.current.toFixed(3),
        avgPower: +avg.toFixed(2),
        maxPower: +maxPRef.current.toFixed(2),
        efficiency: +tel.eff.toFixed(1) || sess.efficiency,
        faultCount: faultNRef.current + (faultExtra ? 1 : 0),
        status,
        socBefore: sess.socBefore,
        socAfter: +tel.socR.toFixed(1),
        donorSocBefore: sess.donorSocBefore,
        donorSocAfter: +tel.socD.toFixed(1),
      };
      setHistory((prev) => {
        const next = [rec, ...prev].slice(0, 50);
        saveHistory(next).catch(() => undefined);
        return next;
      });
      setLastSummary(rec);
      setSession((s) =>
        s
          ? {
              ...s,
              status: status === 'Emergency Stop' ? 'emergency' : status === 'Fault' ? 'fault' : 'completed',
              endTime: end,
              energyWh: rec.energyWh,
              avgPower: rec.avgPower,
              maxPower: rec.maxPower,
              efficiency: rec.efficiency,
              socAfter: rec.socAfter,
              donorSocAfter: rec.donorSocAfter,
              faultCount: rec.faultCount,
            }
          : s,
      );
      setOutgoing(null);
      setIncoming([]);
      setPeerXY(null);
      lastProxBand.current = '';
      pushLog(`Session ${sess.id} closed · ${status}`);
    },
    [pushLog],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const active = wptRef.current === 'active';
      const s = settingsRef.current;
      if (!s.demoMode && !active) return;
      const next = nextDemoTelemetry(telemetryRef.current, active, pendingFault.current ?? undefined);
      if (pendingFault.current && pendingFault.current !== 'NONE') {
        faultNRef.current += 1;
        if (pendingFault.current === 'OT' || pendingFault.current === 'OC' || pendingFault.current === 'OV') {
          setAlert(`FAULT ${pendingFault.current} — hardware protection remains on ESP32/power stage`);
          setWpt('fault');
          finalizeSession('Fault', pendingFault.current);
          pendingFault.current = null;
        }
      }
      if (s.demoMode || active) {
        esp32.ingestRaw(frameFromTelemetry(next));
        if (roomStatus === 'connected' && active && s.role === 'DONOR') room.send('room-telemetry', next);
      }
      if (active) {
        const dtH = TICK_MS / 3600000;
        energyRef.current += next.rxP * dtH;
        powerSumRef.current += next.rxP;
        powerNRef.current += 1;
        maxPRef.current = Math.max(maxPRef.current, next.rxP, next.donorP);
        setPoints((prev) => {
          const pt: GraphPoint = { t: Date.now(), v: next.donorV, i: next.donorI, p: next.rxP, eff: next.eff };
          return [...prev, pt].slice(-400);
        });
        const sess = sessionRef.current;
        if (sess?.startTime) {
          const elapsedMin = (Date.now() - sess.startTime) / 60000;
          if (elapsedMin >= sess.requestedDuration) {
            setWpt('completed');
            finalizeSession('Duration complete');
          } else if (next.socR >= 80) {
            setWpt('completed');
            finalizeSession('Target battery reached');
          } else if (s.role === 'DONOR' && next.socD <= s.minDonorBattery) {
            setAlert('Donor battery reached minimum threshold — transfer stopped');
            setWpt('completed');
            finalizeSession('Min donor battery');
          }
        }
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [finalizeSession, roomStatus]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', () => undefined);
    return () => sub.remove();
  }, []);

  // Privacy-safe proximity tick: round distance + zone + heading, never raw GPS.
  useEffect(() => {
    const timer = setInterval(() => {
      const s = settingsRef.current;
      if (!s.locationTracking) return;
      const self = locationService.getSelf();
      setSelfFix(self);
      let peer = peerXYRef.current;
      const matched = sessionRef.current;
      const pending = incomingRef.current.find((r) => r.status === 'pending');
      if (!peer && matched) {
        const key = s.role === 'DONOR' ? matched.receiverId : matched.donorId;
        peer = DEMO_PEER_XY[key] ?? { x: 40, y: 70 };
        peerXYRef.current = peer;
        setPeerXY(peer);
      } else if (!peer && pending) {
        peer = DEMO_PEER_XY[pending.receiverId] ?? DEMO_PEER_XY['R-17'];
        peerXYRef.current = peer;
        setPeerXY(peer);
      }
      if (!peer) {
        setProximity(null);
        return;
      }
      if (matched && (wptRef.current === 'checking' || wptRef.current === 'ready' || wptRef.current === 'active')) {
        peer = approach(peer, self.xy, 8);
        peerXYRef.current = peer;
        setPeerXY(peer);
      } else {
        peer = jitterXY(peer, 1.6);
        peerXYRef.current = peer;
        setPeerXY(peer);
      }
      const info = describeProximity(self.xy, peer, s.notifyRadius);
      setProximity(info);
      if (pending) {
        setIncoming((rows) =>
          rows.map((r) =>
            r.id === pending.id
              ? { ...r, distance: info.distanceM, zone: info.zone, zoneHint: info.zoneHint, headingLabel: info.headingLabel, bearing: info.bearing, band: info.band }
              : r,
          ),
        );
      }
      const bandKey = `${info.band}|${info.inMeetRange}|${info.inWptRange}`;
      if (bandKey !== lastProxBand.current && s.notifications && (pending || matched)) {
        lastProxBand.current = bandKey;
        if (info.inWptRange) {
          setAlert('Coil range — vehicles aligned for WPT (exact pin hidden)');
          pushNotice({ kind: 'proximity', title: 'In coil range', body: `${info.band} · ${info.zone}` });
        } else if (info.inMeetRange) {
          setAlert(`Meet range · ${info.headingLabel} · ${info.zone}`);
          pushNotice({ kind: 'proximity', title: 'Meet range', body: `${info.headingLabel} · ${info.zone}` });
        }
      }
    }, 1200);
    return () => clearInterval(timer);
  }, [pushNotice]);

  // Demo: when donor is online and idle, generate a receiver request.
  useEffect(() => {
    if (demoReqTimer.current) {
      clearTimeout(demoReqTimer.current);
      demoReqTimer.current = null;
    }
    if (!settings.demoMode || settings.role !== 'DONOR' || !donorOnline || session || incoming.length > 0) {
      return;
    }
    demoReqTimer.current = setTimeout(() => {
      const self = locationService.getSelf();
      const peer = DEMO_PEER_XY['R-17'];
      const prox = describeProximity(self.xy, peer, settings.notifyRadius);
      const req: PowerRequest = {
        id: uid('REQ'),
        receiverId: 'R-17',
        receiverName: 'Receiver EV #17',
        receiverBattery: 18,
        donorId: settings.vehicleId,
        donorName: settings.vehicleName || 'Donor EV',
        donorBattery: telemetryRef.current.socD,
        requestedPower: 12,
        requestedDuration: 30,
        distance: prox.distanceM,
        status: 'pending',
        createdAt: Date.now(),
        zone: prox.zone,
        zoneHint: prox.zoneHint,
        headingLabel: prox.headingLabel,
        bearing: prox.bearing,
        band: prox.band,
      };
      setIncoming([req]);
      setPeerXY(peer);
      setProximity(prox);
      pushLog(`Incoming request · ${prox.headingLabel} · ${prox.zone} (exact pin hidden)`);
      if (settings.notifications) {
        setAlert(`New power request · Receiver EV #17 · ${prox.band} ${prox.bearing} · ${prox.zone}`);
        pushNotice({
          kind: 'request',
          title: 'Receiver nearby needs power',
          body: `${prox.headingLabel} · ${prox.zone} · 12 W · pin hidden`,
          requestId: req.id,
        });
      }
    }, 2200);
    return () => {
      if (demoReqTimer.current) clearTimeout(demoReqTimer.current);
    };
  }, [settings.demoMode, settings.role, settings.vehicleId, settings.vehicleName, settings.notifications, settings.notifyRadius, donorOnline, session, incoming.length, pushLog, pushNotice]);

  const scanDonors = useCallback(() => {
    const self = locationService.getSelf();
    const radius = settingsRef.current.notifyRadius;
    const shuffled = DEMO_DONORS.map((d) => {
      const xy = jitterXY(DEMO_PEER_XY[d.id] ?? DEMO_SELF, 12);
      const p = describeProximity(self.xy, xy, radius);
      return {
        ...d,
        battery: clamp(d.battery + Math.round(Math.random() * 4 - 2), 40, 98),
        distance: p.distanceM,
        zone: p.zone,
        zoneHint: p.zoneHint,
        bearing: p.bearing,
        headingLabel: p.headingLabel,
        status: p.inNotifyRadius ? d.status : d.status === 'busy' ? 'busy' : 'available',
      };
    }).sort((a, b) => a.distance - b.distance);
    setDonors(shuffled);
    pushLog('DEMO NETWORK scan · proximity refresh (no exact GPS published)');
  }, [pushLog]);

  const sendRequest = useCallback(
    (donor: NearbyDonor, power: number, duration: number) => {
      if (donor.battery < settingsRef.current.minDonorBattery) {
        setAlert(`Donor battery ${donor.battery}% is below minimum ${settingsRef.current.minDonorBattery}%`);
        return;
      }
      const self = locationService.getSelf();
      const xy = DEMO_PEER_XY[donor.id] ?? { x: 40, y: 80 };
      const prox = describeProximity(self.xy, xy, settingsRef.current.notifyRadius);
      const req: PowerRequest = {
        id: uid('REQ'),
        receiverId: settingsRef.current.vehicleId,
        receiverName: settingsRef.current.vehicleName || 'Receiver EV',
        receiverBattery: telemetryRef.current.socR,
        donorId: donor.id,
        donorName: donor.name,
        donorBattery: donor.battery,
        requestedPower: power,
        requestedDuration: duration,
        distance: prox.distanceM,
        status: 'pending',
        createdAt: Date.now(),
        zone: prox.zone,
        zoneHint: prox.zoneHint,
        headingLabel: prox.headingLabel,
        bearing: prox.bearing,
        band: prox.band,
      };
      setOutgoing(req);
      setPeerXY(xy);
      setProximity(prox);
      pushLog(`Power request sent → ${donor.name} · ${power} W / ${duration} min · ${prox.headingLabel}`);
      pushNotice({
        kind: 'request',
        title: 'Request sent with proximity ping',
        body: `${donor.name} notified · ${prox.band} · ${prox.zone} · exact pin hidden`,
        requestId: req.id,
      });
      esp32.send('GET_STATUS').catch(() => undefined);
      if (roomStatus === 'connected') room.send('room-request', req);
      if (acceptTimer.current) clearTimeout(acceptTimer.current);
      if (settingsRef.current.demoMode && roomStatus !== 'connected') {
        acceptTimer.current = setTimeout(() => {
          setOutgoing((o) => (o ? { ...o, status: 'accepted' } : o));
          const checks = buildChecks(settingsRef.current, esp32.getStatus() === 'connected');
          const sess: V2VSession = {
            id: uid('SES'),
            donorId: donor.id,
            donorName: donor.name,
            receiverId: req.receiverId,
            receiverName: req.receiverName,
            requestedPower: power,
            requestedDuration: duration,
            status: 'checking',
            energyWh: 0,
            avgPower: 0,
            maxPower: 0,
            efficiency: 0,
            socBefore: telemetryRef.current.socR,
            socAfter: telemetryRef.current.socR,
            donorSocBefore: donor.battery,
            donorSocAfter: donor.battery,
            faultCount: 0,
            faults: [],
            checks,
          };
          energyRef.current = 0;
          powerSumRef.current = 0;
          powerNRef.current = 0;
          maxPRef.current = 0;
          faultNRef.current = 0;
          setSession(sess);
          setWpt('checking');
          pushLog(`MATCHED with ${donor.name} · system check`);
          pushNotice({ kind: 'match', title: 'V2V matched', body: `${donor.name} accepted · close using heading, not a street pin` });
        }, 1800);
      }
    },
    [pushLog, pushNotice, roomStatus],
  );

  const cancelRequest = useCallback(() => {
    if (acceptTimer.current) clearTimeout(acceptTimer.current);
    setOutgoing((o) => (o ? { ...o, status: 'cancelled' } : o));
    setTimeout(() => setOutgoing(null), 400);
    esp32.send('CANCEL_REQUEST').catch(() => undefined);
    pushLog('Power request cancelled');
  }, [pushLog]);

  const openMatchedSession = useCallback(
    (req: PowerRequest) => {
      const checks = buildChecks(settingsRef.current, esp32.getStatus() === 'connected');
      energyRef.current = 0;
      powerSumRef.current = 0;
      powerNRef.current = 0;
      maxPRef.current = 0;
      faultNRef.current = 0;
      setSession({
        id: uid('SES'),
        donorId: req.donorId,
        donorName: req.donorName,
        receiverId: req.receiverId,
        receiverName: req.receiverName,
        requestedPower: req.requestedPower,
        requestedDuration: req.requestedDuration,
        status: 'checking',
        energyWh: 0,
        avgPower: 0,
        maxPower: 0,
        efficiency: 0,
        socBefore: req.receiverBattery,
        socAfter: req.receiverBattery,
        donorSocBefore: telemetryRef.current.socD,
        donorSocAfter: telemetryRef.current.socD,
        faultCount: 0,
        faults: [],
        checks,
      });
      setWpt('checking');
      setDonorOnline(false);
    },
    [],
  );

  const peerDonor = useCallback((peer: RoomPeer): NearbyDonor => ({
    ...DEMO_DONORS[0],
    id: peer.id,
    name: peer.name,
    status: 'available',
  }), []);

  useEffect(() => {
    const offStatus = room.onStatus((status, detail) => {
      setRoomStatus(status);
      if (status === 'connected') setRoomCode(detail ?? room.getCode());
      if (status === 'disconnected') {
        setRoomCode(null);
        setRoomPeer(null);
      }
    });
    const offMessage = room.onMessage((message) => {
      const peer = message.from as RoomPeer | undefined;
      if (message.type === 'peer-joined' && peer) {
        setRoomPeer(peer);
        if (settingsRef.current.role === 'RECEIVER') setDonors([peerDonor(peer)]);
      }
      if (message.type === 'joined') {
        const joinedPeer = message.peers?.[0] as RoomPeer | undefined;
        if (joinedPeer) {
          setRoomPeer(joinedPeer);
          if (settingsRef.current.role === 'RECEIVER') setDonors([peerDonor(joinedPeer)]);
        }
      }
      if (message.type === 'peer-left') {
        setRoomPeer(null);
        if (settingsRef.current.role === 'RECEIVER') setDonors([]);
      }
      if (message.type === 'room-request' && settingsRef.current.role === 'DONOR' && message.payload) {
        const request = message.payload as PowerRequest;
        setIncoming([request]);
        setPeerXY(DEMO_PEER_XY[request.receiverId] ?? { x: 40, y: 70 });
        pushNotice({ kind: 'request', title: 'Live room request', body: `${request.receiverName} · ${request.requestedPower} W`, requestId: request.id });
      }
      if (message.type === 'room-accept' && settingsRef.current.role === 'RECEIVER' && message.payload) {
        const request = message.payload as PowerRequest;
        setOutgoing((current) => (current?.id === request.id ? { ...current, status: 'accepted' } : current));
        openMatchedSession(request);
      }
      if (message.type === 'room-check') {
        setSession((current) => (current ? { ...current, status: 'ready' } : current));
        setWpt('ready');
      }
      if (message.type === 'room-wpt' && message.payload) {
        const state = message.payload as { state: WptState; startTime?: number };
        setWpt(state.state);
        setSession((current) => (current ? { ...current, status: state.state === 'active' ? 'active' : current.status, startTime: state.startTime ?? current.startTime } : current));
      }
      if (message.type === 'room-telemetry' && message.payload) setTelemetry(message.payload as Telemetry);
    });
    return () => {
      offStatus();
      offMessage();
    };
  }, [openMatchedSession, peerDonor, pushNotice]);

  const connectRoom = useCallback(async (code?: string) => {
    const role = settingsRef.current.role;
    if (!role) throw new Error('Choose a vehicle role first');
    const profile = {
      id: settingsRef.current.vehicleId,
      name: settingsRef.current.vehicleName || `${settingsRef.current.role ?? 'Vehicle'} EV`,
      role,
    };
    try {
      await room.connect(code, profile);
      pushLog(`Live room connected · ${room.getCode()}`);
    } catch (error) {
      pushLog(`Live room failed · ${String(error)}`);
    }
  }, [pushLog]);

  const leaveRoom = useCallback(() => {
    room.disconnect();
    pushLog('Live room disconnected');
  }, [pushLog]);

  const acceptRequest = useCallback(
    (id: string) => {
      const req = incoming.find((r) => r.id === id);
      if (!req) return;
      if (telemetryRef.current.socD < settingsRef.current.minDonorBattery) {
        setAlert(`Cannot accept — donor battery below ${settingsRef.current.minDonorBattery}%`);
        return;
      }
      esp32.send('ACCEPT_REQUEST', { ID: id }).catch(() => undefined);
      setIncoming((rows) => rows.map((r) => (r.id === id ? { ...r, status: 'accepted' } : { ...r, status: 'rejected' })));
      pushLog(`Accepted ${req.receiverName} · ${req.headingLabel} · ${req.zone}`);
      pushNotice({
        kind: 'match',
        title: 'Request accepted',
        body: `${req.receiverName} · ${req.headingLabel} · ${req.zone} (no exact location shared)`,
        requestId: req.id,
      });
      openMatchedSession(req);
      if (roomStatus === 'connected') room.send('room-accept', req);
    },
    [incoming, openMatchedSession, pushLog, pushNotice, roomStatus],
  );

  const rejectRequest = useCallback(
    (id: string) => {
      esp32.send('REJECT_REQUEST', { ID: id }).catch(() => undefined);
      setIncoming((rows) => rows.filter((r) => r.id !== id));
      pushLog('Request rejected');
    },
    [pushLog],
  );

  const runSystemCheck = useCallback(() => {
    const checks = buildChecks(settingsRef.current, esp32.getStatus() === 'connected' || settingsRef.current.demoMode);
    setSession((s) => (s ? { ...s, checks, status: 'ready' } : s));
    setWpt('ready');
    pushLog('SYSTEM READY · all checks passed');
    if (roomStatus === 'connected') room.send('room-check');
  }, [pushLog, roomStatus]);

  const startWpt = useCallback(async () => {
    await esp32.send('START_WPT');
    setSession((s) => (s ? { ...s, status: 'active', startTime: Date.now() } : s));
    setWpt('active');
    setPoints([]);
    pushLog('WPT START · ZVS inverter + RIC coils energized');
    if (roomStatus === 'connected') room.send('room-wpt', { state: 'active', startTime: Date.now() });
  }, [pushLog, roomStatus]);

  const stopWpt = useCallback(async () => {
    await esp32.send('STOP_WPT');
    setWpt('completed');
    finalizeSession('Stopped');
    pushLog('WPT STOP');
    if (roomStatus === 'connected') room.send('room-wpt', { state: 'completed' });
  }, [finalizeSession, pushLog, roomStatus]);

  const emergencyStop = useCallback(async () => {
    await esp32.send('EMERGENCY_STOP');
    setAlert('EMERGENCY STOP — WPT disabled. Hardware protection remains on the power stage.');
    setWpt('emergency');
    finalizeSession('Emergency Stop');
    pushLog('EMERGENCY STOP issued');
    if (roomStatus === 'connected') room.send('room-wpt', { state: 'emergency' });
  }, [finalizeSession, pushLog, roomStatus]);

  const injectFault = useCallback(
    (code: string) => {
      pendingFault.current = code;
      pushLog(`Fault injected: ${code}`);
    },
    [pushLog],
  );

  const clearFault = useCallback(() => {
    pendingFault.current = null;
    setTelemetry((t) => ({ ...t, fault: 'NONE' }));
    if (wptRef.current === 'fault' || wptRef.current === 'emergency') setWpt('idle');
  }, []);

  const connectEsp32 = useCallback(async () => {
    await esp32.connect(settingsRef.current.esp32Device);
  }, []);

  const disconnectEsp32 = useCallback(async () => {
    await esp32.disconnect();
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]).catch(() => undefined);
  }, []);

  const dark = settings.darkMode;
  const theme = dark ? darkColors : lightColors;

  const value = useMemo<AppCtx>(
    () => ({
      ready,
      theme,
      dark,
      settings,
      updateSettings,
      setRole,
      telemetry,
      linkStatus,
      logs,
      donorOnline,
      setDonorOnline,
      donors,
      incoming,
      outgoing,
      session,
      wpt,
      points,
      history,
      alert,
      dismissAlert: () => setAlert(null),
      scanDonors,
      sendRequest,
      cancelRequest,
      acceptRequest,
      rejectRequest,
      runSystemCheck,
      startWpt,
      stopWpt,
      emergencyStop,
      injectFault,
      clearFault,
      connectEsp32,
      disconnectEsp32,
      clearHistory,
      lastSummary,
      dismissSummary: () => {
        setLastSummary(null);
        setSession(null);
        setWpt('idle');
        setPeerXY(null);
        setProximity(null);
      },
      selfFix,
      peerXY,
      proximity,
      notices,
      dismissNotice: (id: string) => setNotices((rows) => rows.filter((n) => n.id !== id)),
      clearNotices: () => setNotices([]),
      roomStatus,
      roomCode,
      roomPeer,
      connectRoom,
      leaveRoom,
    }),
    [
      ready,
      theme,
      dark,
      settings,
      updateSettings,
      setRole,
      telemetry,
      linkStatus,
      logs,
      donorOnline,
      donors,
      incoming,
      outgoing,
      session,
      wpt,
      points,
      history,
      alert,
      scanDonors,
      sendRequest,
      cancelRequest,
      acceptRequest,
      rejectRequest,
      runSystemCheck,
      startWpt,
      stopWpt,
      emergencyStop,
      injectFault,
      clearFault,
      connectEsp32,
      disconnectEsp32,
      clearHistory,
      lastSummary,
      selfFix,
      peerXY,
      proximity,
      notices,
      roomStatus,
      roomCode,
      roomPeer,
      connectRoom,
      leaveRoom,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}
