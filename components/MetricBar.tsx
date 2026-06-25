"use client";

import { useEffect, useState } from "react";

/* A single fake sub-metric: label, animated mesh fill, and a mono value. */
export default function MetricBar({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: number;
  delay?: number;
}) {
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setFill(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14px] text-body">{label}</span>
        <span className="mono text-[13px] tabular-nums text-ink">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
        <div
          className="mesh-bg h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  );
}
