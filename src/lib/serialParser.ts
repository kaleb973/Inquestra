import type { TelemetrySample } from '@/types/inquestra';

const STRICT_NUMBER_RE = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const TIME_COLUMN_RE = /^(?:time|t|ts|time_ms|time_us|time_s|timestamp|millis|micros|idx|index|seq|id)$/i;

export interface SerialStreamContext {
  valueIndex: number | null;
  unit?: string;
  sensorId?: string;
  col0TimeVotes: number;
  lastCol0: number | null;
}

export function createSerialStreamContext(): SerialStreamContext {
  return {
    valueIndex: null,
    col0TimeVotes: 0,
    lastCol0: null,
  };
}

function toStrictFiniteNumber(token: string): number | null {
  const clean = token.trim();
  if (!clean || !STRICT_NUMBER_RE.test(clean)) return null;
  const num = Number(clean);
  return Number.isFinite(num) ? num : null;
}

function parseJsonTelemetry(
  trimmed: string,
  ctx: SerialStreamContext
): Omit<TelemetrySample, 'timestamp'> | null {
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const obj = parsed as Record<string, unknown>;
    const priorityKeys = ['value', 'val', 'mv', 'v', 'temp', 'ph', 'reading', 'ch0', 'ch0_mv', 'ch0_raw'];
    let pickedKey: string | undefined;
    let pickedValue: number | null = null;

    for (const key of priorityKeys) {
      const candidate = obj[key];
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        pickedKey = key;
        pickedValue = candidate;
        break;
      }
      if (typeof candidate === 'string') {
        const parsedStr = toStrictFiniteNumber(candidate);
        if (parsedStr !== null) {
          pickedKey = key;
          pickedValue = parsedStr;
          break;
        }
      }
    }

    if (pickedValue === null) {
      for (const [key, candidate] of Object.entries(obj)) {
        if (TIME_COLUMN_RE.test(key)) continue;
        if (typeof candidate === 'number' && Number.isFinite(candidate)) {
          pickedKey = key;
          pickedValue = candidate;
          break;
        }
        if (typeof candidate === 'string') {
          const parsedStr = toStrictFiniteNumber(candidate);
          if (parsedStr !== null) {
            pickedKey = key;
            pickedValue = parsedStr;
            break;
          }
        }
      }
    }

    if (pickedValue === null) return null;
    const unit = typeof obj.unit === 'string' && obj.unit.trim() ? obj.unit.trim() : ctx.unit;
    const sensorId =
      typeof obj.sensorId === 'string' && obj.sensorId.trim()
        ? obj.sensorId.trim()
        : pickedKey ?? ctx.sensorId;

    return {
      value: pickedValue,
      ...(unit ? { unit } : {}),
      ...(sensorId ? { sensorId } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Parses a single trimmed or raw serial output line into a measurement sample,
 * handling Inquestra header metadata, multi-column CSV (time_ms,value), key-value pairs,
 * single-line JSON payloads, and scalar numbers.
 */
export function parseSerialLine(
  raw: string,
  ctx: SerialStreamContext
): Omit<TelemetrySample, 'timestamp'> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
    const metaMatch = trimmed.match(/^#\s*inquestra\s*:(.*)$/i);
    if (metaMatch) {
      const body = metaMatch[1];
      const unitMatch = body.match(/(?:^|,)unit=([^,\s]+)/i);
      if (unitMatch?.[1]) {
        ctx.unit = unitMatch[1].trim();
      }
      const channelsMatch = body.match(/channels=([^\r\n]+)/i);
      if (channelsMatch?.[1]) {
        const rawCols = channelsMatch[1].split(',').map((c) => c.trim());
        const cols: string[] = [];
        for (const c of rawCols) {
          if (c.includes('=')) break;
          if (c) cols.push(c);
        }
        const measIdx = cols.findIndex((c) => !TIME_COLUMN_RE.test(c));
        if (measIdx >= 0) {
          ctx.valueIndex = measIdx;
          ctx.sensorId = cols[measIdx];
        }
      }
    }
    return null;
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return parseJsonTelemetry(trimmed, ctx);
  }

  const tokens = /[,\t;]/.test(trimmed)
    ? trimmed.split(/[,\t;]+/).map((t) => t.trim())
    : trimmed.split(/\s+/).map((t) => t.trim());

  if (tokens.length === 0) return null;

  if (tokens.some((t) => t.includes(':') || t.includes('='))) {
    for (const token of tokens) {
      const sepIdx = token.includes('=') ? token.indexOf('=') : token.indexOf(':');
      if (sepIdx <= 0) continue;
      const key = token.slice(0, sepIdx).trim();
      const val = token.slice(sepIdx + 1).trim();
      if (TIME_COLUMN_RE.test(key)) continue;
      const num = toStrictFiniteNumber(val);
      if (num !== null) {
        return {
          value: num,
          sensorId: key,
          ...(ctx.unit ? { unit: ctx.unit } : {}),
        };
      }
    }
    return null;
  }

  if (tokens.length === 1) {
    const num = toStrictFiniteNumber(tokens[0]);
    if (num === null) return null;
    return {
      value: num,
      ...(ctx.unit ? { unit: ctx.unit } : {}),
      ...(ctx.sensorId ? { sensorId: ctx.sensorId } : {}),
    };
  }

  if (tokens.every((t) => toStrictFiniteNumber(t) === null)) {
    const measIdx = tokens.findIndex((t) => t.length > 0 && !TIME_COLUMN_RE.test(t));
    if (measIdx >= 0) {
      ctx.valueIndex = measIdx;
      ctx.sensorId = tokens[measIdx];
    }
    return null;
  }

  if (ctx.valueIndex !== null && ctx.valueIndex < tokens.length) {
    const num = toStrictFiniteNumber(tokens[ctx.valueIndex]);
    if (num !== null) {
      return {
        value: num,
        ...(ctx.unit ? { unit: ctx.unit } : {}),
        ...(ctx.sensorId ? { sensorId: ctx.sensorId } : {}),
      };
    }
  }

  const numericPairs = tokens
    .map((token, idx) => ({ idx, num: toStrictFiniteNumber(token) }))
    .filter((pair): pair is { idx: number; num: number } => pair.num !== null);

  if (numericPairs.length === 0) return null;
  if (numericPairs.length === 1) {
    return {
      value: numericPairs[0].num,
      ...(ctx.unit ? { unit: ctx.unit } : {}),
      ...(ctx.sensorId ? { sensorId: ctx.sensorId } : {}),
    };
  }

  if (tokens.length === 2 && numericPairs.length === 2) {
    return {
      value: numericPairs[1].num,
      ...(ctx.unit ? { unit: ctx.unit } : {}),
      ...(ctx.sensorId ? { sensorId: ctx.sensorId } : {}),
    };
  }

  if (numericPairs[0].idx === 0) {
    const c0 = numericPairs[0].num;
    if (ctx.lastCol0 !== null && c0 >= ctx.lastCol0 && Number.isInteger(c0)) {
      ctx.col0TimeVotes++;
    }
    ctx.lastCol0 = c0;
    if (ctx.col0TimeVotes >= 1 || Number.isInteger(c0)) {
      return {
        value: numericPairs[1].num,
        ...(ctx.unit ? { unit: ctx.unit } : {}),
        ...(ctx.sensorId ? { sensorId: ctx.sensorId } : {}),
      };
    }
  }

  return {
    value: numericPairs[0].num,
    ...(ctx.unit ? { unit: ctx.unit } : {}),
    ...(ctx.sensorId ? { sensorId: ctx.sensorId } : {}),
  };
}
