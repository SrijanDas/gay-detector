"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MeshBackdrop from "@/components/MeshBackdrop";
import TrainingMarquee from "@/components/TrainingMarquee";
import { unlock, setNegativeMode } from "@/lib/store";
import {
  BRAND,
  ENGINE,
  MODEL_VERSION,
  ACCESS_CODE,
  SECRET_NEGATIVE_CODE,
  ACCESS_GRANTED,
  EMPTY_CODE_ERROR,
} from "@/lib/copy";

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");

export default function GatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "granted">(
    "idle"
  );
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "idle") return;
    const entered = normalize(code);
    if (entered.length === 0) {
      setError(EMPTY_CODE_ERROR);
      return;
    }
    const correct = entered === normalize(ACCESS_CODE);
    const secret = entered === normalize(SECRET_NEGATIVE_CODE);

    setStatus("verifying");
    setToast(null);
    window.setTimeout(() => {
      if (!correct && !secret) {
        router.push("/access-denied");
        return;
      }
      setToast(ACCESS_GRANTED);
      setStatus("granted");
      window.setTimeout(() => {
        setNegativeMode(secret);
        unlock();
        router.push("/scan");
      }, 1100);
    }, 1300);
  }

  const busy = status !== "idle";

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas text-ink">
      <MeshBackdrop intensity={0.5} />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md outline-none transition focus-visible:ring-4 focus-visible:ring-accent/15"
        >
          <span className="mesh-bg h-5 w-5 rounded-[6px]" />
          <span className="text-[15px] font-semibold tracking-tight">
            {BRAND}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-glow rounded-full bg-accent" />
            <span className="mono text-[10px] uppercase tracking-widest text-body">
              System online
            </span>
          </span>
          <span className="eyebrow hidden md:inline">{MODEL_VERSION}</span>
        </div>
      </header>

      {/* hero + auth | live system */}
      <section className="relative z-10 mx-auto grid w-full max-w-5xl items-center gap-12 px-6 pb-4 pt-8 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:pt-12">
        <div>
          <p className="eyebrow animate-rise">Classified · AI facial analysis</p>
          <h1
            className="display animate-rise mt-4 text-[clamp(2.4rem,7vw,3.9rem)]"
            style={{ animationDelay: "60ms" }}
          >
            Your face,
            <br />
            analyzed
            <br />
            <span className="mesh-text">by AI.</span>
          </h1>
          <p
            className="animate-rise mt-5 max-w-md text-[16px] leading-relaxed text-body"
            style={{ animationDelay: "120ms" }}
          >
            {BRAND} runs a {ENGINE.toLowerCase()}. A single model analyzes 478
            facial landmarks — jawline, cheekbones, ocular symmetry — and
            returns a classification in seconds. Enter your access code to
            begin.
          </p>

          <form
            onSubmit={handleSubmit}
            className="animate-rise mt-8 w-full max-w-md"
            style={{ animationDelay: "180ms" }}
          >
            <label htmlFor="code" className="eyebrow mb-2 block">
              Access code
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError(null);
                }}
                disabled={busy}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="GAYDAR-7"
                className="mono h-12 w-full sm:flex-1 rounded-md border border-hairline bg-panel px-4 text-[15px] tracking-tight text-ink outline-none transition placeholder:text-mute focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={busy}
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
          </form>

          {error && (
            <div
              role="alert"
              className="animate-rise mt-4 flex max-w-md items-start gap-3 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3"
            >
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-400" />
              <p className="mono text-[13px] leading-snug text-red-200">
                {error}
              </p>
            </div>
          )}

          {toast && status === "granted" && (
            <div
              role="status"
              className="elev animate-rise mt-6 flex max-w-md items-start gap-3 rounded-md bg-card px-4 py-3"
            >
              <span className="mt-1 h-2 w-2 shrink-0 animate-glow rounded-full bg-accent" />
              <p className="mono text-[13px] leading-snug text-body">{toast}</p>
            </div>
          )}
        </div>

        {/* what the model was trained on */}
        <div
          className="animate-rise overflow-hidden rounded-2xl border border-hairline bg-card/60 p-5 backdrop-blur-sm"
          style={{ animationDelay: "240ms" }}
        >
          <div className="flex items-center justify-between">
            <span className="eyebrow">Model training corpus</span>
          </div>
          <p className="mono mt-2 text-[12px] leading-relaxed text-mute">
            A sample of the verified subjects this model was trained on.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            <span className="mono text-[11px] text-mute">
              <span className="text-ink">6,162</span> labeled facial scans
            </span>
            <span className="mono text-[11px] text-mute">
              <span className="text-ink">98.69%</span> validation accuracy
            </span>
          </div>
          <div className="mt-4">
            <TrainingMarquee />
          </div>
        </div>
      </section>
    </main>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
  );
}
