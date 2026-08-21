/** Privacy-first proximity layer.
 *  Peers never receive exact GPS. Only zone, rounded distance and compass heading
 *  are published so a Donor can find a Receiver without knowing the pin.
 */

export type Bearing = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface LocalXY {
  x: number;
  y: number;
}

export interface CampusZone {
  id: string;
  name: string;
  hint: string;
  cx: number;
  cy: number;
}

export interface ProximityInfo {
  zone: string;
  zoneHint: string;
  distanceM: number;
  band: string;
  bearing: Bearing;
  headingLabel: string;
  inNotifyRadius: boolean;
  inMeetRange: boolean;
  inWptRange: boolean;
  etaMin: number;
}

export const CAMPUS_ORIGIN = { lat: 12.9718, lng: 77.5946 };

export const CAMPUS_ZONES: CampusZone[] = [
  { id: 'north-lot', name: 'Campus North Lot', hint: 'EEE block side', cx: -35, cy: 90 },
  { id: 'south-gate', name: 'South Gate Bay', hint: 'visitor parking', cx: 20, cy: -110 },
  { id: 'lab-court', name: 'Power Lab Court', hint: 'WPT test pad', cx: 8, cy: 12 },
  { id: 'east-shed', name: 'East EV Shed', hint: 'covered bays', cx: 140, cy: 30 },
  { id: 'west-oval', name: 'West Oval', hint: 'sports-field edge', cx: -160, cy: -20 },
  { id: 'library', name: 'Library Loop', hint: 'drop-off lane', cx: -70, cy: -80 },
];

const BEARINGS: Bearing[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function bearingFrom(dx: number, dy: number): Bearing {
  const deg = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
  const idx = Math.round(deg / 45) % 8;
  return BEARINGS[idx];
}

export function headingWords(b: Bearing): string {
  const map: Record<Bearing, string> = {
    N: 'north',
    NE: 'northeast',
    E: 'east',
    SE: 'southeast',
    S: 'south',
    SW: 'southwest',
    W: 'west',
    NW: 'northwest',
  };
  return map[b];
}

export function nearestZone(p: LocalXY): CampusZone {
  let best = CAMPUS_ZONES[0];
  let bestD = Infinity;
  CAMPUS_ZONES.forEach((z) => {
    const d = Math.hypot(p.x - z.cx, p.y - z.cy);
    if (d < bestD) {
      bestD = d;
      best = z;
    }
  });
  return best;
}

export function roundDistance(m: number): number {
  if (m < 20) return Math.max(2, Math.round(m));
  if (m < 80) return Math.round(m / 5) * 5;
  return Math.round(m / 10) * 10;
}

export function distanceBand(m: number): string {
  if (m <= 3) return 'coil range';
  if (m <= 15) return 'within 15 m';
  if (m <= 50) return 'within 50 m';
  if (m <= 120) return 'about 100 m';
  if (m <= 250) return 'about 200 m';
  return 'beyond 250 m';
}

export function describeProximity(self: LocalXY, peer: LocalXY, notifyRadius: number): ProximityInfo {
  const dx = peer.x - self.x;
  const dy = peer.y - self.y;
  const raw = Math.hypot(dx, dy);
  const m = roundDistance(raw);
  const zone = nearestZone(peer);
  const b = bearingFrom(dx, dy);
  return {
    zone: zone.name,
    zoneHint: zone.hint,
    distanceM: m,
    band: distanceBand(raw),
    bearing: b,
    headingLabel: `${m} m ${headingWords(b)}`,
    inNotifyRadius: raw <= notifyRadius,
    inMeetRange: raw <= 15,
    inWptRange: raw <= 3,
    etaMin: Math.max(1, Math.round(raw / 70)),
  };
}

export const DEMO_SELF: LocalXY = { x: 0, y: 0 };

export const DEMO_PEER_XY: Record<string, LocalXY> = {
  'D-01': { x: -48, y: 108 },
  'D-02': { x: 90, y: 220 },
  'D-03': { x: 18, y: -80 },
  'D-04': { x: 240, y: 200 },
  'D-05': { x: -150, y: 90 },
  'R-17': { x: -28, y: 86 },
};

export function jitterXY(p: LocalXY, amt = 4): LocalXY {
  return {
    x: p.x + (Math.random() * 2 - 1) * amt,
    y: p.y + (Math.random() * 2 - 1) * amt,
  };
}

/** Ease peer toward self so matched vehicles appear to close the gap. */
export function approach(from: LocalXY, to: LocalXY, step = 6): LocalXY {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy);
  if (d < 2.2) return { x: to.x + 1.4, y: to.y + 0.6 };
  const k = Math.min(step, d) / d;
  return { x: from.x + dx * k, y: from.y + dy * k };
}

export type LocationFixSource = 'demo-campus' | 'device';

export interface SelfFix {
  xy: LocalXY;
  zone: string;
  source: LocationFixSource;
  tracking: boolean;
}

class LocationService {
  private self: LocalXY = { ...DEMO_SELF };
  private tracking = true;
  private source: LocationFixSource = 'demo-campus';
  private watchId: number | null = null;

  getSelf(): SelfFix {
    const z = nearestZone(this.self);
    return { xy: { ...this.self }, zone: z.name, source: this.source, tracking: this.tracking };
  }

  setSelf(xy: LocalXY) {
    this.self = xy;
  }

  nudgeSelf(dx: number, dy: number) {
    this.self = { x: this.self.x + dx, y: this.self.y + dy };
  }

  setTracking(on: boolean) {
    this.tracking = on;
    if (!on) this.stopDevice();
  }

  isTracking() {
    return this.tracking;
  }

  startDeviceIfAvailable() {
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
    if (!geo || !this.tracking) return;
    try {
      this.watchId = geo.watchPosition(
        (pos) => {
          const dLat = (pos.coords.latitude - CAMPUS_ORIGIN.lat) * 111320;
          const dLng = (pos.coords.longitude - CAMPUS_ORIGIN.lng) * 111320 * Math.cos((CAMPUS_ORIGIN.lat * Math.PI) / 180);
          this.self = { x: dLng, y: dLat };
          this.source = 'device';
        },
        () => {
          this.source = 'demo-campus';
        },
        { enableHighAccuracy: true, maximumAge: 4000, timeout: 8000 },
      );
    } catch {
      this.source = 'demo-campus';
    }
  }

  stopDevice() {
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
    if (geo && this.watchId != null) {
      geo.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

export const locationService = new LocationService();
