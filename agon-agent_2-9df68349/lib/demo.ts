import { NearbyDonor, Telemetry } from './types';
import { DEMO_PEER_XY, DEMO_SELF, describeProximity } from './location';

function donorFrom(id: string, name: string, battery: number, availablePower: number, status: NearbyDonor['status'], voltage: number, temp: number): NearbyDonor {
  const p = describeProximity(DEMO_SELF, DEMO_PEER_XY[id] ?? DEMO_SELF, 250);
  return {
    id,
    name,
    battery,
    availablePower,
    distance: p.distanceM,
    status,
    voltage,
    temp,
    zone: p.zone,
    zoneHint: p.zoneHint,
    bearing: p.bearing,
    headingLabel: p.headingLabel,
  };
}

export const DEMO_DONORS: NearbyDonor[] = [
  donorFrom('D-01', 'Donor EV #01', 78, 15, 'available', 12.4, 32),
  donorFrom('D-02', 'Donor EV #02', 91, 18, 'available', 12.55, 29),
  donorFrom('D-03', 'Donor EV #03', 64, 10, 'available', 12.18, 34),
  donorFrom('D-04', 'Donor EV #04', 55, 8, 'busy', 12.05, 36),
  donorFrom('D-05', 'Donor EV #05', 88, 16, 'available', 12.48, 30),
];

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function jitter(n: number, amt: number) {
  return n + (Math.random() * 2 - 1) * amt;
}

export function nextDemoTelemetry(prev: Telemetry, active: boolean, injectFault?: string): Telemetry {
  if (!active) {
    return {
      ...prev,
      donorI: +(Math.max(0, prev.donorI * 0.25)).toFixed(2),
      donorP: +(Math.max(0, prev.donorP * 0.2)).toFixed(2),
      rxI: +(Math.max(0, prev.rxI * 0.2)).toFixed(2),
      rxP: +(Math.max(0, prev.rxP * 0.15)).toFixed(2),
      txV: +(prev.donorV * 0.2).toFixed(2),
      freq: 0,
      eff: 0,
      wpt: 'OFF',
      fault: injectFault ?? 'NONE',
    };
  }

  const donorV = +clamp(jitter(prev.donorV || 12.4, 0.04), 12.0, 12.6).toFixed(2);
  const donorI = +clamp(jitter(prev.donorI || 1.15, 0.08), 0.5, 1.5).toFixed(2);
  const donorP = +(donorV * donorI).toFixed(2);
  const txV = +clamp(donorV * 0.96 + jitter(0, 0.05), 11.4, 12.3).toFixed(2);
  const rxV = +clamp(jitter(prev.rxV || 10.9, 0.07), 10.0, 12.5).toFixed(2);
  const rxI = +clamp(donorI * 0.9 + jitter(0, 0.05), 0.45, 1.4).toFixed(2);
  const rxP = +(rxV * rxI).toFixed(2);
  const eff = +clamp((rxP / Math.max(donorP, 0.01)) * 100 + jitter(0, 1.2), 70, 90).toFixed(1);
  const temp = +clamp(jitter(prev.temp || 32, 0.25), 25, 40).toFixed(1);
  const rxTemp = +clamp(jitter(prev.rxTemp || 30, 0.22), 25, 39).toFixed(1);
  const freq = +clamp(jitter(prev.freq || 85, 0.4), 83, 87).toFixed(1);
  const socR = +clamp((prev.socR || 18) + 0.12 + Math.random() * 0.08, 0, 100).toFixed(1);
  const socD = +clamp((prev.socD || 82) - 0.05 - Math.random() * 0.03, 0, 100).toFixed(1);

  return {
    donorV,
    donorI,
    donorP,
    rxV,
    rxI,
    rxP,
    txV,
    temp,
    rxTemp,
    freq,
    eff,
    socD: Number(socD),
    socR: Number(socR),
    wpt: 'ON',
    fault: injectFault ?? 'NONE',
  };
}

export function frameFromTelemetry(t: Telemetry): string {
  return [
    `DONOR_V=${t.donorV.toFixed(2)}`,
    `DONOR_I=${t.donorI.toFixed(2)}`,
    `DONOR_P=${t.donorP.toFixed(2)}`,
    `RX_V=${t.rxV.toFixed(2)}`,
    `RX_I=${t.rxI.toFixed(2)}`,
    `RX_P=${t.rxP.toFixed(2)}`,
    `TX_V=${t.txV.toFixed(2)}`,
    `TEMP=${t.temp.toFixed(1)}`,
    `RX_TEMP=${t.rxTemp.toFixed(1)}`,
    `FREQ=${t.freq.toFixed(1)}`,
    `EFF=${t.eff.toFixed(1)}`,
    `SOC_D=${t.socD.toFixed(1)}`,
    `SOC_R=${t.socR.toFixed(1)}`,
    `WPT=${t.wpt}`,
    `FAULT=${t.fault}`,
  ].join(',');
}

export function formatDuration(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return `${m}m ${r.toString().padStart(2, '0')}s`;
}

export function formatWh(wh: number) {
  if (wh >= 1000) return `${(wh / 1000).toFixed(2)} kWh`;
  return `${wh.toFixed(2)} Wh`;
}
