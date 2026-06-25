"use client";

import { useEffect, useRef, useState } from "react";

const SRC = "/bg-music.mp3";
const MUTED_KEY = "spectrum.music.muted"; // mirrors lib/store.ts namespacing

function readMuted(): boolean {
  try {
    return window.sessionStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMuted(muted: boolean): void {
  try {
    window.sessionStorage.setItem(MUTED_KEY, muted ? "1" : "0");
  } catch {
    /* storage unavailable — preference just won't persist */
  }
}

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);

  // Autoplay on mount; fall back to the first user gesture if the browser
  // blocks it (the standard autoplay-with-fallback pattern).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const initialMuted = readMuted();
    setMuted(initialMuted);
    audio.muted = initialMuted;
    audio.volume = 0.4;

    let removeFallback = () => {};

    const tryPlay = () => {
      audio.play().catch(() => {
        // Blocked — wait for the first interaction, then try once more.
        const onGesture = () => {
          audio.play().catch(() => {});
          removeFallback();
        };
        window.addEventListener("pointerdown", onGesture);
        window.addEventListener("keydown", onGesture);
        window.addEventListener("touchstart", onGesture);
        removeFallback = () => {
          window.removeEventListener("pointerdown", onGesture);
          window.removeEventListener("keydown", onGesture);
          window.removeEventListener("touchstart", onGesture);
        };
      });
    };

    tryPlay();
    return () => removeFallback();
  }, []);

  function toggleMuted() {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    audio.muted = next;
    setMuted(next);
    writeMuted(next);
    // If autoplay never kicked in, treat this click as the starting gesture.
    if (audio.paused) audio.play().catch(() => {});
  }

  return (
    <>
      <audio ref={audioRef} src={SRC} loop preload="auto" />
      <button
        type="button"
        onClick={toggleMuted}
        aria-label={muted ? "Unmute music" : "Mute music"}
        aria-pressed={muted}
        className="fixed bottom-4 right-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-card text-body backdrop-blur-sm transition hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15"
      >
        {muted ? <MutedIcon /> : <SoundIcon />}
      </button>
    </>
  );
}

function SoundIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 5a9 9 0 0 1 0 14" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="m23 9-6 6" />
      <path d="m17 9 6 6" />
    </svg>
  );
}
