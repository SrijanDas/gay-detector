/*
 * All user-facing humor lives here so the jokes are easy to tune.
 * Voice: a clinical detection system. Deadpan, technical, certain.
 * The verdict is always positive — the comedy is in the seriousness.
 */

export const BRAND = "Gay Detector";
export const ENGINE = "Homosexuality Detection System";
export const MODEL_VERSION = "v4.2.0";

// Rotating telemetry shown during the "scan". Reads like a real CV pipeline,
// then doesn't.
export const SCAN_STATUS: string[] = [
  "Initializing detection pipeline…",
  "Acquiring 478 facial landmarks…",
  "Computing jawline definition vector…",
  "Measuring inter-ocular symmetry…",
  "Sampling cheekbone prominence…",
  "Estimating eyebrow arch curvature…",
  "Analyzing lip vermilion ratio…",
  "Running gait-from-face inference…",
  "Cross-referencing 1.2M labeled samples…",
  "Convolution pass 1/3…",
  "Convolution pass 2/3…",
  "Convolution pass 3/3…",
  "Calibrating confidence interval…",
  "Compiling classification…",
];

// Headline tier, chosen by which bucket the score lands in (low → high).
export interface Tier {
  min: number;
  tier: string;
  verdict: string;
}

export const TIERS: Tier[] = [
  {
    min: 0,
    tier: "Positive · Low Margin",
    verdict: "The classifier hesitated for 0.4s, then flagged you anyway.",
  },
  {
    min: 75,
    tier: "Positive · Confirmed",
    verdict: "Detection is conclusive. The facial signal is unambiguous.",
  },
  {
    min: 88,
    tier: "Positive · High Confidence",
    verdict: "Our reviewers flagged this score for being almost too clean.",
  },
  {
    min: 96,
    tier: "Positive · Maximum Alert",
    verdict: "Off the charts. The model requested a second monitor.",
  },
];

// Facial-feature sub-metrics. Each is derived from the captured frame
// (see analysis.ts) — these are the labels.
export interface MetricSpec {
  key: string;
  label: string;
}

export const METRIC_SPECS: MetricSpec[] = [
  { key: "jawline", label: "Jawline Definition" },
  { key: "symmetry", label: "Inter-ocular Symmetry" },
  { key: "cheekbone", label: "Cheekbone Prominence" },
  { key: "brow", label: "Eyebrow Arch Index" },
  { key: "lips", label: "Lip Vermilion Ratio" },
  { key: "glow", label: "Dermal Luminance" },
];

// Pseudo-scientific paragraph fragments, assembled deterministically.
export const BLURB_OPENERS: string[] = [
  "After extracting 478 facial landmarks across 47 detection passes,",
  "Following a triple-blind convolutional analysis of your bone structure,",
  "Having cross-referenced your facial geometry against 1.2 million samples,",
];

export const BLURB_BODIES: string[] = [
  "the system reached a positive classification with high confidence.",
  "every model in the ensemble returned the same verdict.",
  "the jawline and ocular vectors were, frankly, decisive.",
];

export const BLURB_CLOSERS: string[] = [
  "The finding is logged and non-appealable. Welcome to the dataset.",
  "No further review is required. The face does not lie.",
  "Detection complete. Resistance was statistically futile.",
];

// The one legitimate access code. Entry is case-insensitive and ignores
// whitespace. Everything else is a denial — see below.
export const ACCESS_CODE = "GAYDAR-7";

// Shown for a beat when the correct code is entered, just before the scanner.
export const ACCESS_GRANTED = "Access code accepted. Detection bay is ready.";

// Wrong code → no scan needed. The system has already made up its mind.
export const ACCESS_DENIED_TITLE = "Access denied";
export const ACCESS_DENIED_VERDICT =
  "Invalid access code. In our records, only a positive subject mistypes the credential. Classification logged as conclusive — the scan was a formality you no longer require.";

// Funny fallback when the camera is denied.
export const CAMERA_DENIED =
  "Camera access refused. Noted as evasive behavior. The model already has a strong prior — we'll proceed on metadata alone.";
