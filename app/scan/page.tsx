"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ScannerView from "@/components/ScannerView";
import { isUnlocked, saveResult } from "@/lib/store";
import { BRAND, ENGINE } from "@/lib/copy";
import type { AnalysisResult } from "@/lib/analysis";

export default function ScanPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isUnlocked()) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  function handleComplete(result: AnalysisResult, shot: string | null) {
    saveResult(result, shot);
    router.push("/results");
  }

  if (!ready) return null;

  return (
    <main className="relative flex min-h-dvh flex-col bg-night text-white">
      <div
        aria-hidden
        className="grid-bg pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(120%_80%_at_50%_30%,black,transparent_75%)]"
      />
      <header className="relative z-10 flex items-center justify-between gap-3 px-6 py-4 sm:px-10 sm:py-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md outline-none transition focus-visible:ring-4 focus-visible:ring-white/20"
        >
          <span className="mesh-bg h-5 w-5 rounded-[6px]" />
          <span className="text-[15px] font-semibold tracking-tight">
            {BRAND}
          </span>
        </Link>
        <span className="eyebrow !text-white/45 hidden sm:block">{ENGINE}</span>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-8 sm:px-10 sm:pb-16">
        <p className="eyebrow !text-white/45 animate-rise">Step 2 of 3 · Scanning</p>
        <h1 className="display animate-rise mt-3 text-[clamp(1.9rem,6vw,2.6rem)] text-white">
          Hold still. You are
          <br />
          being <span className="mesh-text">classified.</span>
        </h1>
        <p
          className="animate-rise mt-3 text-[14px] leading-relaxed text-white/55 sm:mt-4 sm:text-[15px]"
          style={{ animationDelay: "80ms" }}
        >
          Center your face in the reticle. Analysis runs entirely on your
          device — no frames are uploaded. Looking away will not help.
        </p>

        <div className="mt-5 sm:mt-8">
          <ScannerView onComplete={handleComplete} />
        </div>
      </section>
    </main>
  );
}
