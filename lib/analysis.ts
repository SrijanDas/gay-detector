/*
 * The "detection engine." It is, of course, nonsense — but the sub-metrics
 * are now genuinely derived from the captured frame's pixels (brightness,
 * symmetry, contrast, warmth, edge density), so the readout actually responds
 * to your face and lighting. The one rule that makes the joke work survives:
 * the verdict is always positive.
 */

import {
  TIERS,
  METRIC_SPECS,
  BLURB_OPENERS,
  BLURB_BODIES,
  BLURB_CLOSERS,
} from "./copy";

export interface Metric {
  key: string;
  label: string;
  value: number;
}

/** Normalized 0..1 features extracted from the frame. */
export interface FaceFeatures {
  brightness: number;
  contrast: number;
  symmetry: number;
  warmth: number;
  edges: number;
  saturation: number;
}

export interface AnalysisResult {
  percentage: number; // always >= FLOOR
  confidence: number;
  tier: string;
  verdict: string;
  metrics: Metric[];
  blurb: string;
  seed: number;
}

export const FLOOR = 69; // nice.
export const CEIL = 99.9;

/** mulberry32 — tiny deterministic PRNG, used for prose + fallbacks. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit string hash (for seeding prose from captured image data). */
export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function pick<T>(arr: T[], r: number): T {
  return arr[Math.floor(r * arr.length) % arr.length];
}

/**
 * Real pixel analysis of the captured frame. Computes global brightness,
 * contrast (std-dev of luma), left/right symmetry, warmth (R−B), edge
 * density (mean luma gradient), and saturation. All normalized to 0..1.
 */
export function extractFeatures(img: ImageData): FaceFeatures {
  const { data, width, height } = img;
  const n = width * height;
  let sumL = 0,
    sumL2 = 0,
    sumR = 0,
    sumG = 0,
    sumB = 0,
    sumSat = 0,
    edge = 0,
    symDiff = 0;

  const luma = new Float32Array(n);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    luma[p] = l;
    sumL += l;
    sumL2 += l * l;
    sumR += r;
    sumG += g;
    sumB += b;
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b);
    sumSat += mx === 0 ? 0 : (mx - mn) / mx;
  }

  const meanL = sumL / n;
  const variance = Math.max(0, sumL2 / n - meanL * meanL);
  const std = Math.sqrt(variance);

  // Horizontal edge density (luma gradient) + left/right symmetry.
  let edgeCount = 0;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 1; x < width; x++) {
      edge += Math.abs(luma[row + x] - luma[row + x - 1]);
      edgeCount++;
    }
    for (let x = 0; x < width >> 1; x++) {
      symDiff += Math.abs(luma[row + x] - luma[row + width - 1 - x]);
    }
  }

  const brightness = clamp01(meanL / 255);
  const contrast = clamp01(std / 80);
  const edges = clamp01(edge / edgeCount / 40);
  const warmth = clamp01((sumR - sumB) / n / 80 + 0.5);
  const saturation = clamp01(sumSat / n);
  // symDiff small => symmetric => high symmetry score.
  const symMean = symDiff / (height * (width >> 1));
  const symmetry = clamp01(1 - symMean / 110);

  return { brightness, contrast, symmetry, warmth, edges, saturation };
}

// Map each facial metric to a blend of real features, then lift into the
// flattering 64–99 band so the readout stays on-brand.
function metricValue(feature: number, lift = 0): number {
  const v = 64 + clamp01(feature) * 35 + lift;
  return Math.max(64, Math.min(99, Math.round(v)));
}

function tierFor(percentage: number) {
  let chosen = TIERS[0];
  for (const t of TIERS) if (percentage >= t.min) chosen = t;
  return chosen;
}

/**
 * Build the result. When `features` is provided the metrics + headline are
 * derived from the actual face; otherwise everything falls back to the seed.
 */
export function generateResult(
  seed: number,
  features?: FaceFeatures
): AnalysisResult {
  const rng = makeRng(seed);

  const f: FaceFeatures = features ?? {
    brightness: rng(),
    contrast: rng(),
    symmetry: rng(),
    warmth: rng(),
    edges: rng(),
    saturation: rng(),
  };

  // Each facial metric is a blend of real features (deadpan-plausible).
  const byKey: Record<string, number> = {
    jawline: metricValue(f.contrast * 0.6 + f.edges * 0.4),
    symmetry: metricValue(f.symmetry, 4),
    cheekbone: metricValue(f.brightness * 0.5 + f.contrast * 0.5),
    brow: metricValue(f.edges * 0.7 + f.contrast * 0.3),
    lips: metricValue(f.warmth * 0.6 + f.saturation * 0.4),
    glow: metricValue(f.brightness * 0.7 + f.saturation * 0.3),
  };

  const metrics: Metric[] = METRIC_SPECS.map((s) => ({
    key: s.key,
    label: s.label,
    value: byKey[s.key] ?? metricValue(rng()),
  }));

  // Headline = average of the facial metrics, lifted above the FLOOR so
  // everyone still scores high but the number tracks the actual face.
  const avg =
    metrics.reduce((a, m) => a + m.value, 0) / metrics.length / 100; // ~0.64–0.99
  const percentage = round1(FLOOR + avg * (CEIL - FLOOR) * 0.62 + 8);
  const pct = Math.min(CEIL, Math.max(FLOOR, percentage));

  const confidence = round1(97 + (f.contrast * 0.5 + f.symmetry * 0.5) * 2.9);

  const { tier, verdict } = tierFor(pct);
  const blurb = `${pick(BLURB_OPENERS, rng())} ${pick(
    BLURB_BODIES,
    rng()
  )} ${pick(BLURB_CLOSERS, rng())}`;

  return { percentage: pct, confidence, tier, verdict, metrics, blurb, seed };
}

/** Convenience: a fresh random seed when there's no image. */
export function randomSeed(): number {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.abs(Math.sin(performance.now?.() ?? 1) * 1e9)) >>> 0;
}
