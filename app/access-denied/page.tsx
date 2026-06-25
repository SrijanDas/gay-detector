"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import MeshBackdrop from "@/components/MeshBackdrop";
import {
  BRAND,
  ENGINE,
  DENIAL_TAUNT,
  DENIAL_PUNCHLINE,
  DENIAL_BUTTON,
} from "@/lib/copy";

export default function AccessDeniedPage() {
  const router = useRouter();

  function tryAgain() {
    router.push("/");
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas text-ink">
      <MeshBackdrop intensity={0.45} />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md outline-none transition focus-visible:ring-4 focus-visible:ring-accent/15"
        >
          <span className="mesh-bg h-5 w-5 rounded-md" />
          <span className="text-[15px] font-semibold tracking-tight">
            {BRAND}
          </span>
        </Link>
        <span className="eyebrow hidden sm:inline">{ENGINE}</span>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-10 text-center sm:px-10">
        <span className="animate-stamp mono rounded-full border border-alert/40 bg-alert/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-alert">
          Access denied
        </span>

        <h1
          className="display animate-rise mt-5 text-[clamp(1.6rem,6vw,2.4rem)] leading-tight"
          style={{ animationDelay: "80ms" }}
        >
          {DENIAL_TAUNT}
        </h1>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/memes/gay-with-finger-pointed-towards-user.jpg"
          alt="model reaction"
          className="animate-rise mt-6 h-64 w-64 rounded-2xl object-cover ring-hair"
          style={{ animationDelay: "120ms" }}
        />

        <p
          className="animate-rise mt-6 max-w-sm text-[16px] leading-relaxed text-body"
          style={{ animationDelay: "200ms" }}
        >
          {DENIAL_PUNCHLINE}
        </p>

        <button
          onClick={tryAgain}
          className="animate-rise mt-8 inline-flex h-12 items-center justify-center rounded-pill bg-white px-7 text-[15px] font-medium text-black transition hover:bg-white/90"
          style={{ animationDelay: "280ms" }}
        >
          {DENIAL_BUTTON}
        </button>
      </section>

      <footer className="relative z-10 px-6 pb-8 pt-12 sm:px-10">
        <p className="mono mx-auto max-w-md text-center text-[11px] leading-relaxed text-mute">
          Parody. {BRAND} detects nothing and classifies no one. Memes are used
          for comedic effect. Everyone is fabulous.
        </p>
      </footer>
    </main>
  );
}
