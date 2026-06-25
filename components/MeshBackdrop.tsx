/*
 * Clinical backdrop: a faint technical grid plus a single cool accent glow.
 * Reads as a surveillance/inference console, not a pride wash.
 */
export default function MeshBackdrop({
  className = "",
  intensity = 0.5,
}: {
  className?: string;
  intensity?: number;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="grid-bg animate-grid absolute inset-0 [mask-image:radial-gradient(120%_90%_at_50%_0%,black,transparent_75%)]" />
      <div
        className="animate-glow absolute left-1/2 top-0 h-[420px] w-[820px] max-w-[100%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.5), rgba(59,130,246,0.18) 45%, transparent 70%)",
          opacity: intensity,
        }}
      />
    </div>
  );
}
