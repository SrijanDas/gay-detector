import { forwardRef } from "react";
import { BRAND, MODEL_VERSION } from "@/lib/copy";
import type { AnalysisResult } from "@/lib/analysis";

/*
 * The shareable "Detection Record". Built to be captured to PNG by
 * html-to-image, so it avoids capture-flaky tricks (no background-clip:text):
 * solid text on a dark card, with the accent used as fills and a top band.
 */
const ResultCard = forwardRef<
  HTMLDivElement,
  { result: AnalysisResult; shot?: string | null }
>(function ResultCard({ result, shot }, ref) {
  return (
    <div
      ref={ref}
      className="relative w-[340px] overflow-hidden rounded-2xl bg-night text-white"
      style={{ fontFamily: "var(--font-geist-sans), Inter, sans-serif" }}
    >
      {/* mesh top band */}
      <div className="mesh-bg h-1.5 w-full" />

      <div className="px-6 pb-6 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="mesh-bg h-4 w-4 rounded-[5px]" />
            <span className="text-[14px] font-semibold tracking-tight">
              {BRAND}
            </span>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              color: "#ff6b6b",
              backgroundColor: "rgba(255,77,77,0.12)",
            }}
          >
            ● Positive
          </span>
        </div>

        {/* avatar + headline */}
        <div className="mt-5 flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
            {shot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shot}
                alt=""
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="mesh-bg h-full w-full opacity-80" />
            )}
          </div>
          <div className="min-w-0">
            <div
              className="text-[11px] uppercase tracking-[0.16em] text-white/45"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Classification
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className="text-[52px] font-semibold leading-none tabular-nums"
                style={{ letterSpacing: "-0.04em" }}
              >
                {result.percentage.toFixed(1)}
              </span>
              <span className="text-[22px] font-semibold text-white/60">%</span>
            </div>
            <div className="text-[13px] text-white/55">gay</div>
          </div>
        </div>

        {/* tier */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
          <span className="mesh-bg h-2 w-2 rounded-full" />
          <span className="text-[13px] font-medium">{result.tier}</span>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-white/70">
          {result.verdict}
        </p>

        {/* footer meta */}
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
          <span
            className="text-[10px] tracking-wider text-white/40"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {MODEL_VERSION} · conf {result.confidence.toFixed(1)}%
          </span>
          <span
            className="text-[10px] tracking-wider text-white/40"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            #{result.seed.toString(16).slice(0, 6).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
});

export default ResultCard;
