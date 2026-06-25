/*
 * The fake "analysis" overlay drawn on top of the webcam feed: a framing
 * reticle, a drifting mesh of "detected landmarks", and a sweeping scan line.
 * Pure decoration — it detects nothing.
 */

// Static pseudo-landmark coordinates (percentages within the frame).
const LANDMARKS: [number, number][] = [
  [38, 34],
  [62, 34],
  [50, 46],
  [50, 56],
  [40, 64],
  [60, 64],
  [50, 68],
  [33, 44],
  [67, 44],
  [44, 30],
  [56, 30],
];

export default function ScanOverlay({ active }: { active: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* corner reticle */}
      <div className="absolute inset-[8%]">
        {(["tl", "tr", "bl", "br"] as const).map((c) => (
          <span
            key={c}
            className={`absolute h-7 w-7 border-cyan/80 ${
              c === "tl"
                ? "left-0 top-0 border-l-2 border-t-2"
                : c === "tr"
                  ? "right-0 top-0 border-r-2 border-t-2"
                  : c === "bl"
                    ? "bottom-0 left-0 border-b-2 border-l-2"
                    : "bottom-0 right-0 border-b-2 border-r-2"
            }`}
          />
        ))}
      </div>

      {/* face oval guide */}
      <div className="absolute left-1/2 top-[47%] h-[68%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/30" />

      {/* landmark dots + connective web */}
      {active && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {LANDMARKS.map(([x, y], i) =>
            LANDMARKS.slice(i + 1).map(([x2, y2], j) => {
              const d = Math.hypot(x - x2, y - y2);
              if (d > 24) return null;
              return (
                <line
                  key={`${i}-${j}`}
                  x1={x}
                  y1={y}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(0,223,216,0.35)"
                  strokeWidth={0.3}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })
          )}
          {LANDMARKS.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={0.9}
              fill="#00dfd8"
              className="animate-blink"
              style={{ animationDelay: `${(i % 5) * 120}ms` }}
            />
          ))}
        </svg>
      )}

      {/* sweeping scan line */}
      {active && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="animate-scanline absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan to-transparent shadow-[0_0_12px_2px_rgba(0,223,216,0.6)]" />
        </div>
      )}
    </div>
  );
}
