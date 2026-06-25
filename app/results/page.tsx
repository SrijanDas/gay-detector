"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GaugeRing from "@/components/GaugeRing";
import MetricBar from "@/components/MetricBar";
import ResultCard from "@/components/ResultCard";
import MeshBackdrop from "@/components/MeshBackdrop";
import { loadResult, loadShot, reset } from "@/lib/store";
import { BRAND, ENGINE } from "@/lib/copy";
import type { AnalysisResult } from "@/lib/analysis";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = loadResult();
    if (!r) {
      router.replace("/");
      return;
    }
    setResult(r);
    setShot(loadShot());
  }, [router]);

  useEffect(() => {
    if (!result) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const colors = ["#22d3ee", "#3b82f6", "#818cf8", "#ffffff"];
      const fire = (delay: number, opts: object) =>
        window.setTimeout(
          () => confetti({ colors, disableForReducedMotion: true, ...opts }),
          delay
        );
      fire(400, { particleCount: 80, spread: 70, origin: { y: 0.3 } });
      fire(700, { particleCount: 40, angle: 60, spread: 55, origin: { x: 0 } });
      fire(700, { particleCount: 40, angle: 120, spread: 55, origin: { x: 1 } });
    });
    return () => {
      cancelled = true;
    };
  }, [result]);

  async function handleDownload() {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#050507",
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = "spectrum-detection-record.png";
      a.click();
    } catch {
      setShareNote("Couldn't render the record — try a screenshot instead.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    const text = `Gay Detector flagged me ${result?.percentage.toFixed(
      1
    )}% gay (${result?.tier}). Detection is conclusive.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: BRAND, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareNote("Result copied to clipboard.");
    } catch {
      /* dismissed */
    }
  }

  function scanAgain() {
    reset();
    router.push("/scan");
  }

  if (!result) return null;

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas text-ink">
      <MeshBackdrop intensity={0.4} />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <span className="mesh-bg h-5 w-5 rounded-[6px]" />
          <span className="text-[15px] font-semibold tracking-tight">
            {BRAND}
          </span>
        </div>
        <span className="eyebrow hidden sm:inline">{ENGINE}</span>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 pb-20 sm:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow animate-rise">Step 3 of 3 · Findings</p>
          <span
            className="animate-stamp inline-flex items-center gap-1.5 rounded-full border border-alert/40 bg-alert/10 px-2.5 py-1"
            style={{ transformOrigin: "left center" }}
          >
            <span className="h-1.5 w-1.5 animate-glow rounded-full bg-alert" />
            <span className="mono text-[10px] font-semibold uppercase tracking-widest text-alert">
              Detection positive
            </span>
          </span>
        </div>
        <h1 className="display animate-rise mt-3 text-[clamp(2rem,6vw,3rem)]">
          Classification <span className="mesh-text">complete.</span>
        </h1>

        <div className="mt-9 grid items-start gap-6 lg:grid-cols-2">
          {/* gauge + verdict + reaction */}
          <div className="rounded-2xl border border-hairline bg-card p-6 sm:p-7">
            <div className="flex flex-col items-center text-center">
              <GaugeRing value={result.percentage} />
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 ring-hair">
                <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
                <span className="text-[14px] font-medium">{result.tier}</span>
              </div>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-body">
                {result.verdict}
              </p>
              <div className="mono mt-2 text-[12px] text-mute">
                Model confidence {result.confidence.toFixed(1)}%
              </div>
            </div>

            {/* model reaction meme */}
            <figure className="relative mt-6 overflow-hidden rounded-xl ring-hair">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/memes/ha-gay.jpg"
                alt="model reaction"
                className="h-56 w-full object-cover object-center sm:h-64"
              />
              <figcaption className="absolute left-0 top-0 m-2 rounded bg-black/60 px-2 py-0.5">
                <span className="mono text-[10px] uppercase tracking-widest text-white/80">
                  Model reaction
                </span>
              </figcaption>
            </figure>
          </div>

          {/* facial signal breakdown */}
          <div className="rounded-2xl border border-hairline bg-card p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Facial signal breakdown</span>
              <span className="mono text-[11px] text-mute">
                {result.metrics.length} features
              </span>
            </div>
            <div className="mt-5 flex flex-col gap-4">
              {result.metrics.map((m, i) => (
                <MetricBar
                  key={m.key}
                  label={m.label}
                  value={m.value}
                  delay={250 + i * 100}
                />
              ))}
            </div>
            <p className="mono mt-6 border-t border-hairline pt-5 text-[13px] leading-relaxed text-body">
              {result.blurb}
            </p>
          </div>
        </div>

        {/* subject-flagged callout (pointing cat) */}
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-hairline bg-card px-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/memes/gay-with-finger-pointed-towards-user.jpg"
            alt=""
            className="h-20 w-20 shrink-0 rounded-lg bg-white/5 object-contain"
          />
          <div>
            <div className="mono text-[11px] uppercase tracking-widest text-alert">
              Subject flagged
            </div>
            <p className="mt-1 text-[14px] text-body">
              The system has reviewed the evidence and is pointing directly at
              you. No appeal has been filed because none would succeed.
            </p>
          </div>
        </div>

        {/* WHY ARE YOU GAE — the closing punchline */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-hairline bg-panel">
          <div className="flex flex-col items-center gap-6 px-6 py-8 sm:flex-row sm:px-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/memes/why-are-you-gay.webp"
              alt="why are you gae"
              className="h-52 w-52 shrink-0 rounded-xl object-cover ring-hair sm:h-60 sm:w-60"
            />
            <div className="text-center sm:text-left">
              <p className="eyebrow">Final inquiry · case closed</p>
              <h2 className="display mt-2 text-[clamp(1.6rem,5vw,2.4rem)]">
                The committee has{" "}
                <span className="mesh-text">one question.</span>
              </h2>
              <p className="mt-2 text-[15px] text-body">
                Detection is final. Logged, signed, and filed. So, on the
                record:
              </p>
            </div>
          </div>
        </div>

        {/* share row */}
        <div className="mt-10 flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="order-2 flex flex-col gap-3 sm:flex-row lg:order-1">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-pill bg-white px-6 text-[15px] font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {downloading ? "Rendering…" : "Download record"}
            </button>
            <button
              onClick={handleShare}
              className="inline-flex h-12 items-center justify-center rounded-pill border border-hairline bg-card px-6 text-[15px] font-medium text-ink transition hover:border-hairline-strong"
            >
              Share result
            </button>
            <button
              onClick={scanAgain}
              className="inline-flex h-12 items-center justify-center rounded-pill px-4 text-[15px] font-medium text-mute transition hover:text-ink"
            >
              Re-scan subject
            </button>
          </div>

          <div className="order-1 lg:order-2">
            <ResultCard ref={cardRef} result={result} shot={shot} />
          </div>
        </div>

        {shareNote && (
          <p className="mono mt-4 text-center text-[12px] text-mute lg:text-left">
            {shareNote}
          </p>
        )}

        <p className="mono mt-12 text-center text-[11px] leading-relaxed text-mute">
          Parody. {BRAND} detects nothing and the score is for laughs. Memes are
          used for comedic effect. Everyone is fabulous. ♥
        </p>
      </section>
    </main>
  );
}
