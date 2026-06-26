"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GaugeRing from "@/components/GaugeRing";
import MetricBar from "@/components/MetricBar";
import ResultCard from "@/components/ResultCard";
import MeshBackdrop from "@/components/MeshBackdrop";
import { loadResult, loadShot, reset } from "@/lib/store";
import {
  BRAND,
  ENGINE,
  NEGATIVE_BADGE,
  NEGATIVE_CLEARED_EYEBROW,
  NEGATIVE_CLEARED_TITLE,
  NEGATIVE_CLEARED_BODY,
  NEGATIVE_MODAL_EYEBROW,
  NEGATIVE_SHARE_TEXT_SUFFIX,
} from "@/lib/copy";
import type { AnalysisResult } from "@/lib/analysis";

export default function ResultsPage() {
    const router = useRouter();
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [shot, setShot] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [shareNote, setShareNote] = useState<string | null>(null);
    const [pending, setPending] = useState<"download" | "share" | null>(null);
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
            setShareNote(
                "Couldn't render the record — try a screenshot instead.",
            );
        } finally {
            setDownloading(false);
        }
    }

    async function handleShare() {
        const text = result?.negative
            ? `Gay Detector cleared me — ${result.percentage.toFixed(
                  1,
              )}% gay (${result.tier}). ${NEGATIVE_SHARE_TEXT_SUFFIX}`
            : `Gay Detector flagged me ${result?.percentage.toFixed(
                  1,
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
        router.push("/");
    }

    function proceed() {
        const action = pending;
        setPending(null);
        if (action === "download") handleDownload();
        else if (action === "share") handleShare();
    }

    if (!result) return null;

    return (
        <main className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas text-ink">
            <MeshBackdrop intensity={0.4} />

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
                <span className="eyebrow hidden sm:inline">{ENGINE}</span>
            </header>

            <section className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 pb-20 sm:px-10">
                <div className="flex flex-wrap items-center gap-3">
                    <p className="eyebrow animate-rise">
                        Step 3 of 3 · Findings
                    </p>
                    <span
                        className="animate-stamp inline-flex items-center gap-1.5 rounded-full border border-alert/40 bg-alert/10 px-2.5 py-1"
                        style={{ transformOrigin: "left center" }}
                    >
                        <span className="h-1.5 w-1.5 animate-glow rounded-full bg-alert" />
                        <span className="mono text-[10px] font-semibold uppercase tracking-widest text-alert">
                            {result.negative ? NEGATIVE_BADGE : "Detection positive"}
                        </span>
                    </span>
                </div>
                <h1 className="display animate-rise mt-3 text-[clamp(2rem,6vw,3rem)]">
                    Classification <span className="mesh-text">complete.</span>
                </h1>

                <div className="mt-9 grid items-stretch gap-6 lg:grid-cols-2">
                    {/* gauge + verdict */}
                    <div className="flex items-center justify-center rounded-2xl border border-hairline bg-card p-6 sm:p-7">
                        <div className="flex flex-col items-center text-center">
                            <GaugeRing value={result.percentage} />
                            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 ring-hair">
                                <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
                                <span className="text-[14px] font-medium">
                                    {result.tier}
                                </span>
                            </div>
                            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-body">
                                {result.verdict}
                            </p>
                            <div className="mono mt-2 text-[12px] text-mute">
                                Model confidence {result.confidence.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    {/* model reaction — the meme is the moment (positive only) */}
                    {result.negative ? (
                        <div className="relative flex flex-col justify-center overflow-hidden rounded-2xl border border-hairline bg-card p-8 text-center sm:p-10">
                            <p className="eyebrow">{NEGATIVE_CLEARED_EYEBROW}</p>
                            <h2 className="display mt-3 text-[clamp(1.6rem,5vw,2.4rem)]">
                                {NEGATIVE_CLEARED_TITLE}
                            </h2>
                            <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-body">
                                {NEGATIVE_CLEARED_BODY}
                            </p>
                            {/* keeps the column tall against its sibling */}
                            <div className="invisible aspect-square w-full" />
                        </div>
                    ) : (
                        <figure className="relative overflow-hidden rounded-2xl border border-hairline bg-black">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/memes/ha-gay.jpg"
                                alt="model reaction"
                                className="absolute inset-0 h-full w-full object-contain"
                            />
                            {/* keeps the column tall when there's no sibling to stretch against */}
                            <div className="invisible aspect-square w-full" />
                        </figure>
                    )}
                </div>

                {/* facial signal breakdown — full width */}
                <div className="mt-6 rounded-2xl border border-hairline bg-card p-6 sm:p-7">
                    <div className="flex items-center justify-between">
                        <span className="eyebrow">Facial signal breakdown</span>
                        <span className="mono text-[11px] text-mute">
                            {result.metrics.length} features
                        </span>
                    </div>
                    <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
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

                {/* WHY ARE YOU GAE — the closing punchline (positive only) */}
                {!result.negative && (
                    <div className="mt-6 overflow-hidden rounded-2xl border border-hairline bg-panel">
                        <div className="flex flex-col items-center gap-6 px-6 py-8 sm:flex-row sm:px-10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/memes/why-are-you-gay.webp"
                                alt="why are you gae"
                                className="h-72 w-72 shrink-0 rounded-xl object-cover ring-hair sm:h-80 sm:w-80 lg:h-96 lg:w-96"
                            />
                            <div className="text-center sm:text-left">
                                <p className="eyebrow">
                                    Final inquiry · case closed
                                </p>
                                <h2 className="display mt-2 text-[clamp(1.6rem,5vw,2.4rem)]">
                                    The committee has{" "}
                                    <span className="mesh-text">one question.</span>
                                </h2>
                            </div>
                        </div>
                    </div>
                )}

                {/* certificate + actions */}
                <div className="mt-12 flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
                    <ResultCard ref={cardRef} result={result} shot={shot} />

                    <div className="flex w-full max-w-sm flex-col gap-5">
                        <div className="text-center lg:text-left">
                            <p className="eyebrow">Your certificate is ready</p>
                            <h2 className="display mt-2 text-[clamp(1.4rem,4vw,2rem)]">
                                Make it{" "}
                                <span className="mesh-text">official.</span>
                            </h2>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setPending("download")}
                                disabled={downloading}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-pill bg-white px-6 text-[15px] font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
                            >
                                {downloading
                                    ? "Rendering…"
                                    : "Download certificate"}
                            </button>
                            <button
                                onClick={() => setPending("share")}
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

                        {shareNote && (
                            <p className="mono text-center text-[12px] text-mute lg:text-left">
                                {shareNote}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* why-are-you-gae gate — must face the question before proceeding */}
            {pending && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 py-10 backdrop-blur-sm"
                    onClick={() => setPending(null)}
                >
                    <div
                        className="animate-rise w-full max-w-sm overflow-hidden rounded-2xl border border-hairline bg-panel"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {!result.negative && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src="/memes/why-are-you-gay.webp"
                                alt="why are you gae"
                                className="block w-full object-cover"
                            />
                        )}
                        <div className="px-6 py-6 text-center">
                            <p className="eyebrow">
                                {result.negative
                                    ? NEGATIVE_MODAL_EYEBROW
                                    : "Final inquiry · before we proceed"}
                            </p>
                            <h3 className="display mt-2 text-[clamp(1.5rem,5vw,2rem)]">
                                {result.negative ? (
                                    <>
                                        You&apos;re{" "}
                                        <span className="mesh-text">free to go.</span>
                                    </>
                                ) : (
                                    <>
                                        Why are you{" "}
                                        <span className="mesh-text">gay?</span>
                                    </>
                                )}
                            </h3>
                            <div className="mt-6 flex flex-col gap-3">
                                <button
                                    onClick={proceed}
                                    className="inline-flex h-12 items-center justify-center rounded-pill bg-white px-6 text-[15px] font-medium text-black transition hover:bg-white/90"
                                >
                                    {pending === "download"
                                        ? "Download certificate"
                                        : "Share result"}
                                </button>
                                <button
                                    onClick={() => setPending(null)}
                                    className="inline-flex h-12 items-center justify-center rounded-pill px-4 text-[15px] font-medium text-mute transition hover:text-ink"
                                >
                                    Never mind
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
