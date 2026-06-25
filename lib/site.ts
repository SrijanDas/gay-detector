/*
 * Single source of truth for SEO / canonical URL.
 * In production on Vercel, VERCEL_PROJECT_PRODUCTION_URL is injected
 * automatically (no protocol). Falls back to an explicit override, then
 * localhost for dev so absolute OG/canonical URLs always resolve.
 */
import { BRAND } from "./copy";

export const SITE_URL = (() => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
})();

export const SITE_NAME = BRAND;

export const SITE_TITLE = `${BRAND} — AI Facial Inference Engine`;

export const SITE_DESCRIPTION =
  "A facial homosexuality detector. 478 landmarks. One neural network. 98.69% confidence. Findings are conclusive.";

export const SITE_KEYWORDS = [
  "gay detector",
  "AI face analysis",
  "facial inference",
  "facial recognition",
  "AI face scanner",
  "facial landmarks",
  "neural network face analysis",
  "parody",
];
