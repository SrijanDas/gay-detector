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
  // Mirror the real <audio> state so the icon never lies. "Audible" means the
  // element is actually playing AND not muted.
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audible = playing && !muted;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const initialMuted = readMuted();
    audio.muted = initialMuted;
    audio.volume = 0.4;
    setMuted(initialMuted);
    setPlaying(!audio.paused);

    // Keep React state synced to whatever the element actually does — whether
    // playback starts via autoplay, the first-gesture fallback, or the toggle.
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onVolumeChange = () => {
      setMuted(audio.muted);
      writeMuted(audio.muted);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("volumechange", onVolumeChange);

    // Autoplay on mount; fall back to the first user gesture if blocked
    // (the standard autoplay-with-fallback pattern).
    let removeFallback = () => {};
    const tryPlay = () => {
      audio.play().catch(() => {
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

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("volumechange", onVolumeChange);
      removeFallback();
    };
  }, []);

  // Toggle audible sound. State updates flow back through the audio events
  // above, so the icon always matches reality.
  function toggleSound() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audible) {
      audio.muted = true; // go silent, keep the track running
    } else {
      audio.muted = false;
      if (audio.paused) audio.play().catch(() => {});
    }
  }

  return (
    <>
      <audio ref={audioRef} src={SRC} loop preload="auto" />
      <button
        type="button"
        onClick={toggleSound}
        aria-label={audible ? "Mute music" : "Unmute music"}
        aria-pressed={!audible}
        className="fixed bottom-4 right-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-card text-body backdrop-blur-sm transition hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15"
      >
        {audible ? <SoundIcon /> : <MutedIcon />}
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
