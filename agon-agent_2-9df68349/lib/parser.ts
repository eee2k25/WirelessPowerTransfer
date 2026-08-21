import { Telemetry } from './types';

function num(raw: string | undefined, fallback = 0): number {
  if (raw == null) return fallback;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Parses ESP32 telemetry frames.
 * Example:
 * DONOR_V=12.40,DONOR_I=1.20,DONOR_P=14.88,RX_V=10.80,RX_I=1.10,RX_P=11.88,TEMP=32.5,FREQ=85,EFF=79.8,SOC_D=82,SOC_R=65,WPT=ON,FAULT=NONE
 */
export function parseEsp32Frame(raw: string, prev?: Telemetry): Telemetry {
  const map: Record<string, string> = {};
  raw.split(',').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx <= 0) return;
    const key = part.slice(0, idx).trim().toUpperCase();
    const val = part.slice(idx + 1).trim();
    map[key] = val;
  });

  const base = prev ?? {
    donorV: 0,
    donorI: 0,
    donorP: 0,
    rxV: 0,
    rxI: 0,
    rxP: 0,
    txV: 0,
    temp: 28,
    rxTemp: 27,
    freq: 0,
    eff: 0,
    socD: 0,
    socR: 0,
    wpt: 'OFF' as const,
    fault: 'NONE',
  };

  const donorV = num(map.DONOR_V, base.donorV);
  const donorI = num(map.DONOR_I, base.donorI);
  const donorP = num(map.DONOR_P, +(donorV * donorI).toFixed(2));
  const rxV = num(map.RX_V, base.rxV);
  const rxI = num(map.RX_I, base.rxI);
  const rxP = num(map.RX_P, +(rxV * rxI).toFixed(2));

  return {
    donorV,
    donorI,
    donorP,
    rxV,
    rxI,
    rxP,
    txV: num(map.TX_V, donorV * 0.96),
    temp: num(map.TEMP, base.temp),
    rxTemp: num(map.RX_TEMP, base.rxTemp),
    freq: num(map.FREQ, base.freq),
    eff: num(map.EFF, base.eff),
    socD: num(map.SOC_D, base.socD),
    socR: num(map.SOC_R, base.socR),
    wpt: (map.WPT === 'ON' || map.WPT === 'OFF' ? map.WPT : base.wpt) as 'ON' | 'OFF',
    fault: map.FAULT ?? base.fault,
  };
}

export function serializeCommand(cmd: string, extra?: Record<string, string | number>): string {
  if (!extra || Object.keys(extra).length === 0) return cmd;
  const tail = Object.entries(extra)
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  return `${cmd}|${tail}`;
}
