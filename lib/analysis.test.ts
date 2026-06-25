import { expect, test, describe } from "bun:test";
import {
  generateResult,
  extractFeatures,
  hashString,
  FLOOR,
  CEIL,
  type FaceFeatures,
} from "./analysis";

describe("generateResult", () => {
  test("everyone is positive: percentage always within [FLOOR, CEIL]", () => {
    for (let seed = 0; seed < 5000; seed++) {
      const r = generateResult(seed);
      expect(r.percentage).toBeGreaterThanOrEqual(FLOOR);
      expect(r.percentage).toBeLessThanOrEqual(CEIL);
    }
  });

  test("is deterministic for a given seed", () => {
    expect(generateResult(12345)).toEqual(generateResult(12345));
  });

  test("returns a well-formed result with 6 facial metrics", () => {
    const r = generateResult(42);
    expect(r.confidence).toBeGreaterThanOrEqual(97);
    expect(r.confidence).toBeLessThanOrEqual(100);
    expect(r.tier.length).toBeGreaterThan(0);
    expect(r.blurb.length).toBeGreaterThan(0);
    expect(r.metrics).toHaveLength(6);
    for (const m of r.metrics) {
      expect(m.value).toBeGreaterThanOrEqual(64);
      expect(m.value).toBeLessThanOrEqual(99);
      expect(m.label.length).toBeGreaterThan(0);
    }
  });

  test("metrics track the supplied facial features", () => {
    const dark: FaceFeatures = {
      brightness: 0.1, contrast: 0.1, symmetry: 0.1,
      warmth: 0.1, edges: 0.1, saturation: 0.1,
    };
    const bright: FaceFeatures = {
      brightness: 0.9, contrast: 0.9, symmetry: 0.9,
      warmth: 0.9, edges: 0.9, saturation: 0.9,
    };
    const lo = generateResult(1, dark);
    const hi = generateResult(1, bright);
    // Higher feature values should not score lower than low ones.
    expect(hi.percentage).toBeGreaterThan(lo.percentage);
    // Still floored — even a near-blank face is decisively gay.
    expect(lo.percentage).toBeGreaterThanOrEqual(FLOOR);
  });
});

describe("extractFeatures", () => {
  test("returns normalized 0..1 features for a solid frame", () => {
    const w = 8, h = 8;
    const data = new Uint8ClampedArray(w * h * 4).fill(128);
    for (let i = 3; i < data.length; i += 4) data[i] = 255; // alpha
    const f = extractFeatures({ data, width: w, height: h } as ImageData);
    for (const v of Object.values(f)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    // A flat gray frame is perfectly symmetric and low-contrast.
    expect(f.symmetry).toBeGreaterThan(0.9);
    expect(f.contrast).toBeLessThan(0.1);
  });
});

describe("hashString", () => {
  test("is stable and differs for different inputs", () => {
    expect(hashString("face")).toBe(hashString("face"));
    expect(hashString("a")).not.toBe(hashString("b"));
  });
});
