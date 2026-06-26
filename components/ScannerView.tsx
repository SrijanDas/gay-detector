"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ScanOverlay from "./ScanOverlay";
import {
  SCAN_STATUS,
  CAMERA_DENIED,
  MODEL_VERSION,
  SCAN_START_PROMPT,
  SCAN_START_BUTTON,
  CAMERA_RETRY_BUTTON,
  CAMERA_BLOCKED_HINT,
  ACQUIRING_PROMPT,
  TRACKING_ALERT,
  TRACKING_PAUSED,
  TRACKING_ABORT,
  TRACKING_RESTART_BUTTON,
  MODEL_LOAD_FAILED,
} from "@/lib/copy";
import { isNegativeMode } from "@/lib/store";
import {
  useFaceTracking,
  SUSTAINED_LOSS_MS,
  type TrackingReason,
} from "@/lib/faceTracking";
import {
  generateResult,
  extractFeatures,
  hashString,
  randomSeed,
  type AnalysisResult,
  type FaceFeatures,
} from "@/lib/analysis";

// "preview"   = camera live, face visible, waiting for the user to press start.
// "acquiring" = scan started, waiting for a real, well-framed face (start gate).
// "alert"     = scan paused mid-run because lock was lost / subject looked away.
type Phase =
  | "requesting"
  | "preview"
  | "acquiring"
  | "scanning"
  | "alert"
  | "denied"
  | "done";

// Scan length varies a little per run so it feels organic, not scripted.
const SCAN_MS_MIN = 8000;
const SCAN_MS_MAX = 10000;
const pickScanMs = () =>
  Math.round(SCAN_MS_MIN + Math.random() * (SCAN_MS_MAX - SCAN_MS_MIN));

export default function ScannerView({
  onComplete,
}: {
  onComplete: (result: AnalysisResult, shot: string | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const durationRef = useRef<number>(SCAN_MS_MAX);
  const accRef = useRef<number>(0); // progress time accumulated while locked (ms)
  const lastTsRef = useRef<number>(0); // previous rAF timestamp
  const alertSinceRef = useRef<number>(0); // when the current loss of lock began
  const blindRef = useRef(false); // skip detection (camera denied / model failed)
  const abortedRef = useRef(false);
  const finishedRef = useRef(false);
  const cancelledRef = useRef(false);
  const requestingRef = useRef(false); // a camera request is in flight

  // Camera is requested automatically on mount, so we start in "requesting".
  const [phase, setPhase] = useState<Phase>("requesting");
  const phaseRef = useRef<Phase>("requesting");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const [progress, setProgress] = useState(0);
  const [trackingReason, setTrackingReason] = useState<TrackingReason>("no-face");
  const [aborted, setAborted] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  // Destructure stable callbacks. NOTE: useFaceTracking() returns a fresh object
  // every render, so depending on the whole object in effects/callbacks would
  // re-run them on every frame (setProgress re-renders) and tear down the camera
  // mid-scan. The individual callbacks are stable (useCallback), so we depend on
  // those instead.
  const { loadModel, detect, reset: resetTracking, close: closeTracking, ready } =
    useFaceTracking();

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Grab a still from the live feed plus real pixel features for analysis.
  const capture = useCallback((): {
    shot: string | null;
    features: FaceFeatures | null;
  } => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return { shot: null, features: null };
    const w = 480;
    const h = Math.round((video.videoHeight / video.videoWidth) * w);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { shot: null, features: null };
    // Mirror so it matches the selfie preview.
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);

    let features: FaceFeatures | null = null;
    try {
      // Sample the central face region for feature extraction.
      const rx = Math.round(w * 0.2);
      const rw = Math.round(w * 0.6);
      const ry = Math.round(h * 0.12);
      const rh = Math.round(h * 0.76);
      features = extractFeatures(ctx.getImageData(rx, ry, rw, rh));
    } catch {
      features = null;
    }

    try {
      return { shot: canvas.toDataURL("image/jpeg", 0.7), features };
    } catch {
      return { shot: null, features };
    }
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const { shot, features } = capture();
    const seed = shot ? hashString(shot.slice(0, 4000)) : randomSeed();
    const result = generateResult(seed, features ?? undefined, {
      negative: isNegativeMode(),
    });
    stopCamera();
    closeTracking();
    setPhase("done");
    onComplete(result, shot);
  }, [capture, onComplete, stopCamera, closeTracking]);

  // rAF recursion goes through a ref so `tick` never references itself.
  const tickRef = useRef<(now: number) => void>(() => {});
  const schedule = useCallback(() => {
    rafRef.current = requestAnimationFrame((t) => tickRef.current(t));
  }, []);

  // Single rAF loop. Progress only advances while a valid face is locked; when
  // lock is lost the scan pauses (and, after SUSTAINED_LOSS_MS, hard-aborts).
  const tick = useCallback(
    (now: number) => {
      if (cancelledRef.current) return;
      const dt = lastTsRef.current ? now - lastTsRef.current : 0;
      lastTsRef.current = now;

      const advance = () => {
        accRef.current += dt;
        const p = Math.min(100, (accRef.current / durationRef.current) * 100);
        setProgress(p);
        return p;
      };

      // Blind scan (camera denied or model unavailable): no gating.
      if (blindRef.current) {
        if (phaseRef.current === "acquiring" || phaseRef.current === "alert") {
          setPhase("scanning");
        }
        if (advance() >= 100) return finish();
        schedule();
        return;
      }

      const status = detect(videoRef.current, now);
      const ok = status?.ok ?? false;

      if (ok) {
        alertSinceRef.current = 0;
        if (phaseRef.current === "acquiring" || phaseRef.current === "alert") {
          setPhase("scanning");
        }
        if (advance() >= 100) return finish();
      } else {
        if (status) setTrackingReason(status.reason);
        if (phaseRef.current === "scanning") {
          setPhase("alert");
          alertSinceRef.current = now;
        } else if (phaseRef.current === "alert") {
          if (
            alertSinceRef.current &&
            now - alertSinceRef.current >= SUSTAINED_LOSS_MS &&
            !abortedRef.current
          ) {
            abortedRef.current = true;
            setAborted(true);
            cancelAnimationFrame(rafRef.current);
            return; // wait for the user to re-initiate
          }
        }
        // "acquiring": stay put, progress holds at 0 (start gate).
      }
      schedule();
    },
    [finish, detect, schedule]
  );

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const beginScan = useCallback(() => {
    accRef.current = 0;
    lastTsRef.current = 0;
    alertSinceRef.current = 0;
    abortedRef.current = false;
    finishedRef.current = false;
    durationRef.current = pickScanMs();
    setProgress(0);
    setAborted(false);
    // Blind scans skip the acquisition gate entirely.
    setPhase(blindRef.current ? "scanning" : "acquiring");
    schedule();
  }, [schedule]);

  // Opens the camera (and starts loading the model in the background), then
  // shows the live preview. The scan itself does NOT start here — the user
  // presses "Start detection" for that. Fires on mount and on "Try camera again".
  const initCamera = useCallback(async () => {
    if (requestingRef.current) return; // guard against concurrent re-entry
    requestingRef.current = true;
    setPhase("requesting");
    setPermissionBlocked(false);
    setModelFailed(false);
    blindRef.current = false;
    // Load the model in the background so it's ready by the time they press start.
    loadModel().then((okModel) => {
      if (cancelledRef.current) return;
      if (!okModel) {
        blindRef.current = true; // model unavailable → scan will run blind
        setModelFailed(true);
      }
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 } },
        audio: false,
      });
      if (cancelledRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      // Live feed is up; wait for the user to start the scan.
      setPhase("preview");
    } catch {
      if (cancelledRef.current) return;
      setPhase("denied");
      // Best-effort: if the permission is hard-blocked (not just dismissed),
      // a plain retry can't re-prompt — surface guidance instead.
      try {
        const status = await navigator.permissions?.query?.({
          name: "camera" as PermissionName,
        });
        if (!cancelledRef.current) setPermissionBlocked(status?.state === "denied");
      } catch {
        /* Permissions API unavailable — leave the hint hidden. */
      }
    } finally {
      requestingRef.current = false;
    }
  }, [loadModel]);

  // The "Start detection" button: begin the actual gated scan on the live feed.
  const startScan = useCallback(() => {
    beginScan();
  }, [beginScan]);

  // Open the camera as soon as the scan page mounts, and tear everything down on
  // unmount. Deps are all stable callbacks, so this runs once.
  useEffect(() => {
    cancelledRef.current = false;
    // Intentional: kick off the async camera request on mount. Its initial
    // setState ("requesting") matches the initial phase, so it's a no-op render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initCamera();
    return () => {
      cancelledRef.current = true;
      cancelAnimationFrame(rafRef.current);
      stopCamera();
      closeTracking();
    };
  }, [initCamera, stopCamera, closeTracking]);

  // "Proceed anyway" after a denial: run a blind scan, then finish.
  const proceedBlind = useCallback(() => {
    blindRef.current = true;
    beginScan();
  }, [beginScan]);

  // Restart after a hard abort: clear tracking state and re-acquire.
  const restart = useCallback(() => {
    resetTracking();
    beginScan();
  }, [beginScan, resetTracking]);

  const statusLine =
    SCAN_STATUS[
      Math.min(
        SCAN_STATUS.length - 1,
        Math.floor((progress / 100) * SCAN_STATUS.length)
      )
    ];

  const alertHeadline = aborted ? TRACKING_ABORT : TRACKING_PAUSED;
  const alertDetail = TRACKING_ALERT[trackingReason] || TRACKING_ALERT["no-face"];

  return (
    <div className="w-full">
      {/* Viewport */}
      <div className="elev-lg relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-black sm:aspect-square sm:max-w-md">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full scale-x-[-1] object-cover opacity-90"
        />

        {/* dark vignette so the overlay reads */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {(phase === "preview" ||
          phase === "scanning" ||
          phase === "acquiring" ||
          phase === "alert") && <ScanOverlay active={phase === "scanning"} />}

        {phase === "requesting" && (
          <Centered>
            <Spinner />
            <p className="mono mt-3 text-[12px] text-white/80">
              Requesting camera access…
            </p>
          </Centered>
        )}

        {/* Live preview: camera on, face visible, waiting for the user to start. */}
        {phase === "preview" && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 pb-5 pt-12">
            <p className="text-center text-[13px] leading-snug text-white/90">
              {SCAN_START_PROMPT}
            </p>
            <button
              onClick={startScan}
              className="inline-flex h-10 items-center rounded-pill bg-white px-5 text-[14px] font-medium text-black transition hover:bg-white/90"
            >
              {SCAN_START_BUTTON}
            </button>
          </div>
        )}

        {/* Start gate: waiting to lock onto a real, well-framed face. */}
        {phase === "acquiring" && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center px-4">
            <p className="mono rounded-full bg-black/55 px-3 py-1.5 text-center text-[12px] text-white/85 backdrop-blur-sm">
              {ready ? ACQUIRING_PROMPT : "Initializing detector…"}
            </p>
          </div>
        )}

        {/* Mid-scan interrupt: lock lost / looking away. */}
        {phase === "alert" && (
          <>
            <div className="animate-siren-flash pointer-events-none absolute inset-0 bg-alert/30" />
            <Centered>
              <p className="mono text-[10px] uppercase tracking-[0.25em] text-red-200/80">
                ⚠ Detection interrupted
              </p>
              <p className="animate-siren mt-2 max-w-[85%] text-center text-[15px] font-semibold leading-snug">
                {alertHeadline}
              </p>
              <p className="mono mt-2 max-w-[85%] text-center text-[12px] leading-snug text-red-100/90">
                {alertDetail}
              </p>
              {aborted && (
                <button
                  onClick={restart}
                  className="mt-5 inline-flex h-10 items-center rounded-pill bg-white px-5 text-[14px] font-medium text-black transition hover:bg-white/90"
                >
                  {TRACKING_RESTART_BUTTON}
                </button>
              )}
            </Centered>
          </>
        )}

        {phase === "denied" && (
          <Centered>
            <p className="max-w-[80%] text-center text-[14px] leading-relaxed text-white/90">
              {CAMERA_DENIED}
            </p>
            <div className="mt-5 flex flex-col items-center gap-3">
              <button
                onClick={initCamera}
                className="inline-flex h-10 items-center rounded-pill bg-white px-5 text-[14px] font-medium text-black transition hover:bg-white/90"
              >
                {CAMERA_RETRY_BUTTON}
              </button>
              <button
                onClick={proceedBlind}
                className="mono text-[12px] text-white/70 underline-offset-4 transition hover:text-white/90 hover:underline"
              >
                Scan on vibes anyway
              </button>
            </div>
            {permissionBlocked && (
              <p className="mono mt-4 max-w-[80%] text-center text-[11px] leading-snug text-white/60">
                {CAMERA_BLOCKED_HINT}
              </p>
            )}
          </Centered>
        )}

        {/* HUD: model tag + live percent */}
        {(phase === "preview" ||
          phase === "scanning" ||
          phase === "acquiring" ||
          phase === "alert") && (
          <>
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm">
              <span
                className={`h-1.5 w-1.5 animate-pulse rounded-full ${
                  phase === "alert" ? "bg-alert" : "bg-cyan"
                }`}
              />
              <span className="mono text-[10px] uppercase tracking-widest text-white/80">
                live · {MODEL_VERSION}
              </span>
            </div>
            {phase !== "preview" && (
              <div className="mono absolute bottom-3 right-3 text-[13px] font-medium tabular-nums text-white">
                {Math.floor(progress)}%
              </div>
            )}
          </>
        )}
      </div>

      {/* Telemetry */}
      <div className="mx-auto mt-4 w-full max-w-md sm:mt-6">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Analysis</span>
          <span className="mono text-[12px] tabular-nums text-mute">
            {Math.floor(progress)} / 100
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
          <div
            className="mesh-bg h-full rounded-full transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mono mt-3 h-4 pr-12 text-[13px] text-body sm:pr-0">
          {phase === "scanning" ? (
            <>
              <span className="text-ink">›</span> {statusLine}
            </>
          ) : phase === "acquiring" ? (
            "Acquiring lock…"
          ) : phase === "alert" ? (
            <span className="text-red-300">⚠ {alertDetail}</span>
          ) : phase === "preview" ? (
            "Camera live · press start to scan"
          ) : phase === "requesting" ? (
            "Standing by for camera…"
          ) : (
            " "
          )}
        </p>
        {modelFailed && (
          <p role="status" className="mono mt-2 text-[12px] leading-snug text-mute">
            {MODEL_LOAD_FAILED}
          </p>
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 px-4">
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}
