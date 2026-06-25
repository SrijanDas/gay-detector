import { forwardRef } from "react";
import { BRAND, MODEL_VERSION } from "@/lib/copy";
import type { AnalysisResult } from "@/lib/analysis";

/*
 * The downloadable "Certificate of Certified Gayness". Built to be captured to
 * PNG by html-to-image, so it avoids capture-flaky tricks (no
 * background-clip:text): solid white text on a dark card, with the mesh accent
 * used only as fills, frames, and the seal.
 */
const ResultCard = forwardRef<
  HTMLDivElement,
  { result: AnalysisResult; shot?: string | null }
>(function ResultCard({ result }, ref) {
  const serial = `#${result.seed.toString(16).slice(0, 6).toUpperCase()}`;
  const issued = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      ref={ref}
      className="mesh-bg w-full max-w-90 rounded-2xl p-[2px]"
      style={{ fontFamily: "var(--font-geist-sans), Inter, sans-serif" }}
    >
      <div className="relative overflow-hidden rounded-[15px] bg-night px-7 pb-7 pt-6 text-white">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="mesh-bg h-4 w-4 rounded-[5px]" />
            <span className="text-[13px] font-semibold tracking-tight">
              {BRAND}
            </span>
          </div>
          <span
            className="text-[10px] tracking-wider text-white/40"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            No. {serial}
          </span>
        </div>

        {/* official seal */}
        <div className="mt-6 flex justify-center">
          <div className="mesh-bg flex h-16 w-16 items-center justify-center rounded-full">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-night">
              <span className="text-[24px] font-bold leading-none">✓</span>
            </div>
          </div>
        </div>

        {/* title block */}
        <div className="mt-5 text-center">
          <div
            className="text-[10px] uppercase tracking-[0.3em] text-white/45"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Official Certificate
          </div>
          <p className="mx-auto mt-3 max-w-[15rem] text-[12px] leading-relaxed text-white/55">
            This is to certify that the bearer has been examined and is hereby
          </p>
          <h2
            className="mt-2 text-[34px] font-bold leading-none tracking-tight"
            style={{ letterSpacing: "-0.02em" }}
          >
            CERTIFIED GAY
          </h2>
          <div className="mesh-bg mx-auto mt-3 h-[3px] w-24 rounded-full" />
        </div>

        {/* score */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <span
            className="text-[40px] font-semibold leading-none tabular-nums"
            style={{ letterSpacing: "-0.04em" }}
          >
            {result.percentage.toFixed(1)}
            <span className="text-[20px] font-semibold text-white/60">%</span>
          </span>
          <div className="text-left">
            <div className="text-[12px] font-medium leading-tight">
              {result.tier}
            </div>
            <div
              className="text-[10px] uppercase tracking-wider text-white/40"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              accuracy {result.confidence.toFixed(1)}%
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[12px] leading-relaxed text-white/65">
          {result.verdict}
        </p>

        {/* footer meta */}
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-3">
          <span
            className="text-[9px] tracking-wider text-white/35"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {BRAND} - {MODEL_VERSION}
          </span>
          <span
            className="text-[9px] tracking-wider text-white/35"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {issued}
          </span>
        </div>
      </div>
    </div>
  );
});

export default ResultCard;
