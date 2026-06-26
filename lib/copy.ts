/*
 * All user-facing humor lives here so the jokes are easy to tune.
 * Voice: a clinical detection system. Deadpan, technical, certain.
 * The verdict is always positive — the comedy is in the seriousness.
 */

export const BRAND = "Gay Detector";
export const ENGINE = "Homosexuality Detection System";
export const MODEL_VERSION = "v0.1.0";

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
  "Cross-referencing 2,000 labeled samples…",
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
  "After extracting 478 facial landmarks across 3 detection passes,",
  "Following a triple-blind convolutional analysis of your bone structure,",
  "Having cross-referenced your facial geometry against 2,000 samples,",
];

export const BLURB_BODIES: string[] = [
  "the system reached a positive classification with high confidence.",
  "the model returned the same verdict on every run.",
  "the jawline and ocular vectors were, frankly, decisive.",
];

export const BLURB_CLOSERS: string[] = [
  "The finding is logged and non-appealable. Welcome to the dataset.",
  "No further review is required. The face does not lie.",
  "Detection complete. Resistance was statistically futile.",
];

// The one legitimate access code. Entry is case-insensitive and ignores
// whitespace. Everything else is a denial — see below.
export const ACCESS_CODE = "GAYDAR7";

// Easter egg: the "calibration override" code. Grants access just like the
// real code, but flips the engine into a negative pass — the one path where
// the detector clears you. Same normalization rules (case/whitespace).
export const SECRET_NEGATIVE_CODE = "GAYDER7";

// Shown inline when someone hits the button without typing anything — the
// button is always live, so this nudges them to actually enter a code.
export const EMPTY_CODE_ERROR = "Enter your access code to continue.";

// Negative-pass headline tiers, keyed by the (low) "% gay" reading. Same
// deadpan voice as TIERS, but the verdict goes the other way for once.
export const NEGATIVE_TIERS: Tier[] = [
  {
    min: 0,
    tier: "Negative · Conclusive",
    verdict: "The classifier found nothing to flag.",
  },
  {
    min: 10,
    tier: "Negative · Trace Signal",
    verdict: "A faint signal was logged, then dismissed as a lighting artifact.",
  },
  {
    min: 22,
    tier: "Negative · Borderline",
    verdict: "Cleared, but the model has asked to keep your file open.",
  },
];

export const NEGATIVE_BLURB_BODIES: string[] = [
  "the system returned a negative classification with high confidence.",
  "every detection pass came back clean, no caveats.",
  "the jawline and ocular vectors declined to incriminate you.",
];

export const NEGATIVE_BLURB_CLOSERS: string[] = [
  "The finding is logged and, for once, exculpatory. You may go.",
  "No flag was raised.",
  "Detection complete. The dataset will have to do without you.",
];

// Negative-pass result-page copy (mirrors the positive punchlines).
export const NEGATIVE_BADGE = "Detection negative";
export const NEGATIVE_CLEARED_EYEBROW = "Model reaction · no flag raised";
export const NEGATIVE_CLEARED_TITLE = "The committee has nothing to say.";
export const NEGATIVE_CLEARED_BODY =
  "478 landmarks, three passes, zero hits. The detector ran out of things to say and simply cleared the bay.";
export const NEGATIVE_MODAL_EYEBROW = "Case dismissed · before we proceed";
export const NEGATIVE_CERT_TITLE = "CERTIFIED NOT GAY";
export const NEGATIVE_SHARE_TEXT_SUFFIX = "Detection was negative. Cleared.";

// Shown for a beat when the correct code is entered, just before the scanner.
export const ACCESS_GRANTED = "Access code accepted. Detection bay is ready.";

// Idle scanner state — detection is manual; the subject must opt in.
export const SCAN_START_PROMPT = "Position your face in frame, then begin.";
export const SCAN_START_BUTTON = "Start detection";

// Wrong code → bounced to /access-denied.
export const DENIAL_TAUNT = "You thought you could get in?";
export const DENIAL_PUNCHLINE = "Now go back to doing your gay shit.";
export const DENIAL_BUTTON = "Yes I am gay - try again";

// Funny fallback when the camera is denied.
export const CAMERA_DENIED =
  "Camera access refused. Noted as evasive behavior. The model already has a strong prior — we'll proceed on metadata alone.";
