"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MeshBackdrop from "@/components/MeshBackdrop";
import TrainingGallery from "@/components/TrainingGallery";
import { unlock } from "@/lib/store";
import {
  BRAND,
  ENGINE,
  MODEL_VERSION,
  EASTER_EGGS,
  GENERIC_GRANTS,
} from "@/lib/copy";

export default function GatePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "granted">(
    "idle"
  );
  const [toast, setToast] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "idle") return;
    const trimmed = code.trim().toLowerCase().replace(/\s+/g, "");
    const egg = EASTER_EGGS[trimmed];
    const message =
      egg ??
      GENERIC_GRANTS[
        Math.abs(trimmed.length * 7 + (trimmed.charCodeAt(0) || 0)) %
          GENERIC_GRANTS.length
      ];

    setStatus("verifying");
    setToast(null);
    window.setTimeout(() => {
      setToast(message);
      setStatus("granted");
      window.setTimeout(() => {
        unlock();
        router.push("/scan");
      }, 1100);
    }, 1300);
  }

  function focusAccess() {
    document.getElementById("access")?.scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => inputRef.current?.focus(), 400);
  }

  const busy = status !== "idle";

  return (
    <main className="relative flex min-h-dvh flex-col bg-canvas text-ink">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 border-b border-hairline/70 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="mesh-bg h-5 w-5 rounded-[6px]" />
            <span className="text-[15px] font-semibold tracking-tight">
              {BRAND}
            </span>
            <span className="eyebrow ml-2 hidden sm:inline">
              {MODEL_VERSION}
            </span>
          </div>
          <div className="hidden items-center gap-7 md:flex">
            <a href="#subjects" className="text-[14px] text-body transition hover:text-ink">
              Subjects
            </a>
            <a href="#how" className="text-[14px] text-body transition hover:text-ink">
              How it works
            </a>
            <a href="#specs" className="text-[14px] text-body transition hover:text-ink">
              Model
            </a>
          </div>
          <button
            onClick={focusAccess}
            className="inline-flex h-9 items-center rounded-pill bg-white px-4 text-[14px] font-medium text-black transition hover:bg-white/90"
          >
            Initialize
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <MeshBackdrop intensity={0.55} />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card/60 px-3 py-1">
              <span className="h-1.5 w-1.5 animate-glow rounded-full bg-accent" />
              <span className="mono text-[11px] uppercase tracking-widest text-body">
                Detection model {MODEL_VERSION} · live
              </span>
            </span>
            <h1 className="display animate-rise mt-5 text-[clamp(2.6rem,7vw,4.4rem)]">
              Homosexuality
              <br />
              detection, from
              <br />
              <span className="mesh-text">a single frame.</span>
            </h1>
            <p
              className="animate-rise mt-6 max-w-md text-[17px] leading-relaxed text-body"
              style={{ animationDelay: "80ms" }}
            >
              {BRAND} maps 478 facial landmarks against 1.2M labeled subjects and
              returns a forensic-grade classification in seconds. No survey. No
              consent. Just the face.
            </p>

            <form
              id="access"
              onSubmit={handleSubmit}
              className="animate-rise mt-9 w-full max-w-md scroll-mt-24"
              style={{ animationDelay: "140ms" }}
            >
              <label htmlFor="code" className="eyebrow mb-2 block">
                Access code
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="code"
                  ref={inputRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={busy}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="SPECTRUM-7"
                  className="mono h-12 flex-1 rounded-md border border-hairline bg-panel px-4 text-[15px] tracking-tight text-ink outline-none transition placeholder:text-mute focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={busy || code.trim().length === 0}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-pill bg-white px-6 text-[15px] font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {status === "verifying" ? (
                    <>
                      <Spinner /> Authenticating…
                    </>
                  ) : status === "granted" ? (
                    "Access granted"
                  ) : (
                    "Initialize scanner"
                  )}
                </button>
              </div>
              <p className="mono mt-3 text-[12px] text-mute">
                Any code authenticates. There is no waitlist. There is no escape.
              </p>
              {toast && (
                <div
                  role="status"
                  className="elev animate-rise mt-5 flex items-start gap-3 rounded-md bg-card px-4 py-3"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 animate-glow rounded-full bg-accent" />
                  <p className="mono text-[13px] leading-snug text-body">
                    {toast}
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* hero specs panel */}
          <div
            className="animate-rise rounded-2xl border border-hairline bg-card/60 p-6 backdrop-blur-sm"
            style={{ animationDelay: "200ms" }}
          >
            <span className="eyebrow">Live system</span>
            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline">
              <Cell k="Landmarks" v="478" />
              <Cell k="Ensemble" v="47 models" />
              <Cell k="Accuracy" v="99.7%" />
              <Cell k="Latency" v="5.6s" />
            </div>
            <div className="mt-4 rounded-xl border border-hairline bg-panel p-4">
              <div className="flex items-center justify-between">
                <span className="mono text-[11px] text-mute">throughput</span>
                <span className="mono text-[11px] text-accent">+12.4%</span>
              </div>
              <div className="mt-3 flex h-16 items-end gap-1">
                {[40, 55, 48, 70, 62, 85, 78, 92, 88, 99].map((h, i) => (
                  <div
                    key={i}
                    className="mesh-bg flex-1 rounded-sm"
                    style={{ height: `${h}%`, opacity: 0.45 + i * 0.055 }}
                  />
                ))}
              </div>
            </div>
            <p className="mono mt-4 text-[11px] leading-relaxed text-mute">
              99.4% of subjects scanned this hour returned positive. The
              remaining 0.6% are pending re-scan.
            </p>
          </div>
        </div>
      </section>

      {/* ── Subjects gallery ────────────────────────────────── */}
      <section id="subjects" className="border-t border-hairline scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <span className="eyebrow">Verified training subjects</span>
              <h2 className="display mt-3 text-[clamp(1.8rem,4.5vw,2.6rem)]">
                The model has <span className="mesh-text">seen everyone.</span>
              </h2>
            </div>
            <p className="mono max-w-xs text-[12px] leading-relaxed text-mute">
              A representative sample from the 1.2M-subject corpus. Every entry
              returned positive. No exceptions have ever been recorded.
            </p>
          </div>
          <div className="mt-8">
            <TrainingGallery />
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how" className="border-t border-hairline scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
          <span className="eyebrow">Protocol</span>
          <h2 className="display mt-3 text-[clamp(1.8rem,4.5vw,2.6rem)]">
            Three steps. One verdict.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Step n="01" title="Authenticate" body="Enter any access code. The system does not gatekeep — it only classifies." />
            <Step n="02" title="Scan" body="Hold your face to the camera. 478 landmarks are extracted on-device in 5.6 seconds." />
            <Step n="03" title="Receive classification" body="A score, a confidence interval, and a signed detection record. Non-appealable." />
          </div>
        </div>
      </section>

      {/* ── Specs / CTA band ────────────────────────────────── */}
      <section id="specs" className="border-t border-hairline scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-hairline bg-panel p-10 text-center sm:p-16">
            <MeshBackdrop intensity={0.4} />
            <div className="relative z-10">
              <h2 className="display mx-auto max-w-2xl text-[clamp(2rem,5vw,3.2rem)]">
                Your face is already <span className="mesh-text">in the dataset.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[16px] text-body">
                There is nothing to install and nothing to hide. Step into the
                scanner.
              </p>
              <button
                onClick={focusAccess}
                className="mt-8 inline-flex h-12 items-center justify-center rounded-pill bg-white px-7 text-[15px] font-medium text-black transition hover:bg-white/90"
              >
                Initialize scanner
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="mesh-bg h-4 w-4 rounded-[5px]" />
            <span className="text-[14px] font-semibold">{BRAND}</span>
            <span className="eyebrow ml-1">{ENGINE}</span>
          </div>
          <p className="mono max-w-xl text-[11px] leading-relaxed text-mute">
            Parody. {BRAND} detects nothing, makes no factual or medical claims,
            and is not a real classifier. Faces and memes are used for satire and
            comedic effect. Your camera frame never leaves this device. Everyone
            is fabulous.
          </p>
        </div>
      </footer>
    </main>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-card p-4">
      <div className="display text-[20px] text-ink">{v}</div>
      <div className="eyebrow mt-1 text-[10px]!">{k}</div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-card p-6">
      <span className="mono text-[13px] text-accent">{n}</span>
      <h3 className="mt-3 text-[18px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-body">{body}</p>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
  );
}
