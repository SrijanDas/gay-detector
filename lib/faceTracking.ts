/*
 * Real face tracking for the scan. The detection CORE (evaluateResult +
 * createTracker) is framework-agnostic and pure, so it can be unit-tested
 * without a browser or the MediaPipe runtime. The useFaceTracking hook wraps
 * MediaPipe's FaceLandmarker and is browser-only (dynamically imported).
 *
 * What we enforce while scanning:
 *   - a face is actually present,
 *   - it's framed properly (big enough, centered, not cut off by an edge),
 *   - the subject is facing the camera (not turned away).
 */

"use client";

import { useCallback, useRef, useState } from "react";

export type TrackingReason =
  | "ok"
  | "no-face"
  | "too-small"
  | "too-close"
  | "off-center"
  | "cut-off"
  | "looking-away";

export interface TrackingStatus {
  facePresent: boolean;
  inFrame: boolean; // big enough + centered + not cut off
  lookingAway: boolean;
  ok: boolean; // facePresent && inFrame && !lookingAway
  reason: TrackingReason; // the first failing check (priority order)
}

// --- Tunable thresholds (all normalized 0..1 unless noted) -----------------
export const MIN_FACE_FRACTION = 0.16; // face box must span >=16% of the frame
export const MAX_FACE_FRACTION = 0.95; // ...and not basically fill it (too close)
export const CENTER_TOLERANCE = 0.22; // |faceCenter - 0.5| allowed on each axis
export const EDGE_MARGIN = 0.02; // box must sit >=2% inside every edge
export const MAX_YAW_DEG = 22; // head turn left/right before "looking away"
export const MAX_PITCH_DEG = 18; // head tilt up/down before "looking away"
export const GRACE_MS = 800; // bad state must persist this long before firing
export const RECOVER_MS = 400; // good state must persist this long before clearing
export const SUSTAINED_LOSS_MS = 4000; // continuous loss this long => hard abort
export const DETECT_INTERVAL_MS = 125; // ~8fps detection (independent of 60fps rAF)

// Minimal structural shape of a MediaPipe FaceLandmarkerResult — kept local so
// the pure core doesn't depend on the heavy @mediapipe import.
export interface FaceDetectionInput {
  faceLandmarks: { x: number; y: number }[][];
  facialTransformationMatrixes?: { data: number[] }[];
}

/**
 * Decompose a MediaPipe facial transformation matrix into yaw/pitch degrees.
 * `data` is a flattened 4x4 (column-major). We threshold on absolute angle, so
 * a row/column-major mix-up (transpose => negated angles) doesn't affect the
 * magnitude, and roll (head tilt) is intentionally ignored.
 */
export function matrixToYawPitch(data: number[]): { yaw: number; pitch: number } {
  if (!data || data.length < 16) return { yaw: 0, pitch: 0 };
  // R[row][col] = data[col*4 + row]
  const r = (row: number, col: number) => data[col * 4 + row];
  const sy = Math.hypot(r(0, 0), r(1, 0));
  const pitch = Math.atan2(r(2, 1), r(2, 2)); // rotation about X (up/down)
  const yaw = Math.atan2(-r(2, 0), sy); // rotation about Y (left/right)
  const deg = 180 / Math.PI;
  return { yaw: yaw * deg, pitch: pitch * deg };
}

function fail(
  reason: TrackingReason,
  parts: { facePresent: boolean; inFrame: boolean; lookingAway: boolean }
): TrackingStatus {
  return { ...parts, ok: false, reason };
}

/**
 * Pure evaluation of a single detection frame -> a TrackingStatus. No timing,
 * no smoothing (that's createTracker's job).
 */
export function evaluateResult(input: FaceDetectionInput): TrackingStatus {
  const lm = input.faceLandmarks?.[0];
  if (!lm || lm.length === 0) {
    return fail("no-face", { facePresent: false, inFrame: false, lookingAway: false });
  }

  let minX = 1,
    minY = 1,
    maxX = 0,
    maxY = 0;
  for (const p of lm) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const cutOff =
    minX < EDGE_MARGIN ||
    minY < EDGE_MARGIN ||
    maxX > 1 - EDGE_MARGIN ||
    maxY > 1 - EDGE_MARGIN;

  const size = Math.max(maxX - minX, maxY - minY);
  const tooSmall = size < MIN_FACE_FRACTION;
  const tooClose = size > MAX_FACE_FRACTION;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const offCenter =
    Math.abs(cx - 0.5) > CENTER_TOLERANCE || Math.abs(cy - 0.5) > CENTER_TOLERANCE;

  let lookingAway = false;
  const mat = input.facialTransformationMatrixes?.[0]?.data;
  if (mat) {
    const { yaw, pitch } = matrixToYawPitch(mat);
    lookingAway = Math.abs(yaw) > MAX_YAW_DEG || Math.abs(pitch) > MAX_PITCH_DEG;
  }

  const inFrame = !cutOff && !tooSmall && !tooClose && !offCenter;
  const parts = { facePresent: true, inFrame, lookingAway };

  // Priority: framing problems first, then gaze.
  if (cutOff) return fail("cut-off", parts);
  if (tooSmall) return fail("too-small", parts);
  if (tooClose) return fail("too-close", parts);
  if (offCenter) return fail("off-center", parts);
  if (lookingAway) return fail("looking-away", parts);

  return { facePresent: true, inFrame: true, lookingAway: false, ok: true, reason: "ok" };
}

const INITIAL_STATUS: TrackingStatus = {
  facePresent: false,
  inFrame: false,
  lookingAway: false,
  ok: false,
  reason: "no-face",
};

export interface Tracker {
  /** Feed a raw per-frame status; returns the smoothed/committed status. */
  push(raw: TrackingStatus, now: number): TrackingStatus;
  current(): TrackingStatus;
  reset(): void;
}

/**
 * Hysteresis state machine over raw per-frame statuses. A bad state must
 * persist GRACE_MS before it's committed (so blinks / single dropped frames
 * don't trip the alert); recovery needs RECOVER_MS of sustained "ok".
 */
export function createTracker(): Tracker {
  let committed: TrackingStatus = INITIAL_STATUS;
  let badSince: number | null = null;
  let goodSince: number | null = null;

  return {
    push(raw, now) {
      if (raw.ok) {
        badSince = null;
        if (committed.ok) {
          committed = raw;
        } else {
          if (goodSince === null) goodSince = now;
          if (now - goodSince >= RECOVER_MS) {
            committed = raw;
            goodSince = null;
          }
        }
      } else {
        goodSince = null;
        if (!committed.ok) {
          // Already in a bad state — surface the latest reason immediately.
          committed = raw;
        } else {
          if (badSince === null) badSince = now;
          if (now - badSince >= GRACE_MS) {
            committed = raw;
            badSince = null;
          }
        }
      }
      return committed;
    },
    current() {
      return committed;
    },
    reset() {
      committed = INITIAL_STATUS;
      badSince = null;
      goodSince = null;
    },
  };
}

// --- React hook: owns the MediaPipe FaceLandmarker (browser only) ----------

export interface FaceTracking {
  loadModel: () => Promise<boolean>; // idempotent; resolves to true once ready, false if it failed
  ready: boolean;
  loadFailed: boolean;
  /** Throttled detect; returns the committed status (or null if not ready). */
  detect: (video: HTMLVideoElement | null, now: number) => TrackingStatus | null;
  reset: () => void;
  close: () => void;
}

const MODEL_PATH = "/models/face_landmarker.task";
const WASM_PATH = "/models"; // dir containing vision_wasm_internal.{js,wasm}

interface Landmarker {
  detectForVideo: (v: HTMLVideoElement, ts: number) => FaceDetectionInput;
  close: () => void;
}

// The FaceLandmarker is expensive to build (~15MB wasm+model) and is safe to
// reuse, so we keep ONE shared instance for the whole session. This also avoids
// React StrictMode's dev-only mount → unmount → mount cycle, which previously
// closed the model mid-load and left detection permanently disabled. We never
// tear the model down per component — only the camera is stopped on unmount.
let sharedLandmarker: Landmarker | null = null;
let sharedLoadPromise: Promise<boolean> | null = null;

async function ensureLandmarker(): Promise<boolean> {
  if (sharedLandmarker) return true;
  if (sharedLoadPromise) return sharedLoadPromise;
  sharedLoadPromise = (async () => {
    try {
      const { FilesetResolver, FaceLandmarker } = await import(
        "@mediapipe/tasks-vision"
      );
      const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
      sharedLandmarker = (await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_PATH },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFacialTransformationMatrixes: true,
      })) as unknown as Landmarker;
      return true;
    } catch {
      sharedLoadPromise = null; // allow a retry on the next call
      return false;
    }
  })();
  return sharedLoadPromise;
}

export function useFaceTracking(): FaceTracking {
  const trackerRef = useRef<Tracker>(createTracker());
  const lastDetectTsRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);

  const [ready, setReady] = useState(() => !!sharedLandmarker);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadModel = useCallback(async () => {
    setLoadFailed(false);
    const ok = await ensureLandmarker();
    if (ok) setReady(true);
    else setLoadFailed(true);
    return ok;
  }, []);

  const detect = useCallback((video: HTMLVideoElement | null, now: number) => {
    const lm = sharedLandmarker;
    if (!lm) return null;
    const committed = trackerRef.current.current();
    // Throttle detection independently of the 60fps progress loop.
    if (now - lastDetectTsRef.current < DETECT_INTERVAL_MS) return committed;
    if (!video || video.readyState < 2 || !video.videoWidth) return committed;
    // Skip if the frame hasn't advanced (same result, wasted compute).
    if (video.currentTime === lastVideoTimeRef.current) return committed;
    lastDetectTsRef.current = now;
    lastVideoTimeRef.current = video.currentTime;
    try {
      const result = lm.detectForVideo(video, now);
      return trackerRef.current.push(evaluateResult(result), now);
    } catch {
      return committed;
    }
  }, []);

  const reset = useCallback(() => {
    trackerRef.current.reset();
    lastDetectTsRef.current = 0;
    lastVideoTimeRef.current = -1;
  }, []);

  // The shared model is intentionally kept alive for instant re-scans; this only
  // resets this component's tracking state.
  const close = useCallback(() => {
    trackerRef.current.reset();
  }, []);

  return { loadModel, ready, loadFailed, detect, reset, close };
}
