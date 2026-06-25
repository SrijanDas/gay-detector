/*
 * Tiny sessionStorage bridge between the three screens.
 * Nothing leaves the browser — which is also the privacy gag.
 */

import type { AnalysisResult } from "./analysis";

const GATE_KEY = "spectrum.unlocked";
const RESULT_KEY = "spectrum.result";
const SHOT_KEY = "spectrum.shot"; // captured frame as a data URL (optional)

function safe(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function unlock(): void {
  safe()?.setItem(GATE_KEY, "1");
}

export function isUnlocked(): boolean {
  return safe()?.getItem(GATE_KEY) === "1";
}

export function saveResult(result: AnalysisResult, shot?: string | null): void {
  const s = safe();
  if (!s) return;
  s.setItem(RESULT_KEY, JSON.stringify(result));
  if (shot) s.setItem(SHOT_KEY, shot);
  else s.removeItem(SHOT_KEY);
}

export function loadResult(): AnalysisResult | null {
  const raw = safe()?.getItem(RESULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}

export function loadShot(): string | null {
  return safe()?.getItem(SHOT_KEY) ?? null;
}

export function reset(): void {
  const s = safe();
  if (!s) return;
  s.removeItem(RESULT_KEY);
  s.removeItem(SHOT_KEY);
}
