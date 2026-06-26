"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import MeshBackdrop from "@/components/MeshBackdrop";
import { unlock } from "@/lib/store";
import { BRAND, ENGINE, DENIAL_TAUNT, DENIAL_BUTTON } from "@/lib/copy";

export default function AccessDeniedPage() {
    const router = useRouter();

    function tryAgain() {
        unlock();
        router.push("/scan");
    }

    return (
        <main className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas text-ink">
            <MeshBackdrop intensity={0.45} />

            {/* Police-siren red alert: full-screen frame that pulses in sync with the heading */}
            <div
                aria-hidden
                className="animate-siren-flash pointer-events-none fixed inset-0 z-0"
                style={{
                    boxShadow: "inset 0 0 220px 40px rgba(255, 77, 77, 0.85)",
                    background:
                        "radial-gradient(120% 120% at 50% 50%, transparent 45%, rgba(255, 77, 77, 0.35) 100%)",
                }}
            />

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
                <span className="animate-stamp block">
                    <span className="animate-siren display block text-[clamp(2.2rem,9vw,4rem)] font-bold uppercase leading-[0.95] tracking-tight text-alert">
                        Access denied
                    </span>
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

                <button
                    onClick={tryAgain}
                    className="animate-rise mt-8 inline-flex h-12 items-center justify-center rounded-pill bg-white px-7 text-[15px] font-medium text-black transition hover:bg-white/90"
                    style={{ animationDelay: "280ms" }}
                >
                    {DENIAL_BUTTON}
                </button>
            </section>
        </main>
    );
}
