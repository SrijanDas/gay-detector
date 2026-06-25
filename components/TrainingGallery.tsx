/*
 * "Verified training subjects" — recognizable faces presented as clinical
 * detection samples. Big, premium cards (this reads as a real dataset viewer),
 * desaturated until hovered, each stamped POSITIVE with a match score.
 * The recognizability is the joke; we never type a name.
 */

interface Subject {
  src: string;
  id: string;
  match: string;
}

const SUBJECTS: Subject[] = [
  { src: "/gay-faces/trump.jpg", id: "SUBJ·0xA1", match: "98.4%" },
  { src: "/gay-faces/sam-altman.webp", id: "SUBJ·0x2F", match: "97.1%" },
  { src: "/gay-faces/trudeau.jpg", id: "SUBJ·0x9C", match: "99.2%" },
  { src: "/gay-faces/tim-cook.jpeg", id: "SUBJ·0x07", match: "99.9%" },
  { src: "/gay-faces/joginder.jpeg", id: "SUBJ·0xB3", match: "96.8%" },
  { src: "/gay-faces/two-men.png", id: "SUBJ·0xFF", match: "100%" },
];

export default function TrainingGallery() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {SUBJECTS.map((s) => (
        <figure
          key={s.id}
          className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-hairline bg-panel"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.src}
            alt="verified training subject"
            loading="lazy"
            className="evidence h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          {/* scan tint */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

          {/* top: sample id + live dot */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-2.5">
            <span className="mono text-[10px] tracking-wider text-white/70">
              {s.id}
            </span>
            <span className="h-1.5 w-1.5 animate-glow rounded-full bg-accent shadow-[0_0_6px_var(--color-accent)]" />
          </div>

          {/* bottom: verdict */}
          <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between px-3 pb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-alert/40 bg-alert/15 px-2 py-0.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-alert" />
              <span className="mono text-[10px] font-semibold uppercase tracking-wider text-[#ff8a8a]">
                Positive
              </span>
            </span>
            <span className="mono text-[13px] font-medium tabular-nums text-white">
              {s.match}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
