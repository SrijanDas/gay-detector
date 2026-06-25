"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ScanOverlay from "./ScanOverlay";
import { SCAN_STATUS, CAMERA_DENIED, MODEL_VERSION } from "@/lib/copy";
import {
  generateResult,
  extractFeatures,
  hashString,
  randomSeed,
  type AnalysisResult,
  type FaceFeatures,
} from "@/lib/analysis";

type Phase = "requesting" | "scanning" | "denied" | "done";

const SCAN_MS = 5600;

export default function ScannerView({
  onComplete,
}: {
  onComplete: (result: AnalysisResult, shot: string | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const finishedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("requesting");
  const [progress, setProgress] = useState(0);

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
    const result = generateResult(seed, features ?? undefined);
    stopCamera();
    setPhase("done");
    onComplete(result, shot);
  }, [capture, onComplete, stopCamera]);

  // Drive the scan progress bar with rAF once we're scanning.
  const tick = useCallback(
    (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const p = Math.min(100, (elapsed / SCAN_MS) * 100);
      setProgress(p);
      if (p >= 100) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [finish]
  );

  const beginScan = useCallback(() => {
    startRef.current = 0;
    setPhase("scanning");
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // Ask for the camera on mount.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        beginScan();
      } catch {
        if (!cancelled) setPhase("denied");
      }
    }
    init();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Proceed anyway" after a denial: run a blind scan, then finish.
  const proceedBlind = useCallback(() => {
    setPhase("scanning");
    startRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const statusLine =
    SCAN_STATUS[
      Math.min(
        SCAN_STATUS.length - 1,
        Math.floor((progress / 100) * SCAN_STATUS.length)
      )
    ];

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

        {(phase === "scanning" || phase === "requesting") && (
          <ScanOverlay active={phase === "scanning"} />
        )}

        {phase === "requesting" && (
          <Centered>
            <Spinner />
            <p className="mono mt-3 text-[12px] text-white/80">
              Requesting camera access…
            </p>
          </Centered>
        )}

        {phase === "denied" && (
          <Centered>
            <p className="max-w-[80%] text-center text-[14px] leading-relaxed text-white/90">
              {CAMERA_DENIED}
            </p>
            <button
              onClick={proceedBlind}
              className="mt-5 inline-flex h-10 items-center rounded-pill bg-white px-5 text-[14px] font-medium text-ink transition hover:bg-white/90"
            >
              Scan on vibes anyway
            </button>
          </Centered>
        )}

        {/* HUD: model tag + live percent */}
        {phase === "scanning" && (
          <>
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />
              <span className="mono text-[10px] uppercase tracking-widest text-white/80">
                live · {MODEL_VERSION}
              </span>
            </div>
            <div className="mono absolute bottom-3 right-3 text-[13px] font-medium tabular-nums text-white">
              {Math.floor(progress)}%
            </div>
          </>
        )}
      </div>

      {/* Telemetry */}
      <div className="mx-auto mt-6 w-full max-w-md">
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
        <p className="mono mt-3 h-4 text-[13px] text-body">
          {phase === "scanning" ? (
            <>
              <span className="text-ink">›</span> {statusLine}
            </>
          ) : phase === "requesting" ? (
            "Standing by for camera…"
          ) : (
            " "
          )}
        </p>
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
