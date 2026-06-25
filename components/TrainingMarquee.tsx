/*
 * "Verified training subjects" as an old-school right-to-left marquee.
 * Recognizable faces presented as clinical detection samples — desaturated
 * until hovered, each stamped POSITIVE with a match score. The track is
 * duplicated so the −50% translate loops seamlessly. Stack a couple of rows
 * at different speeds for a richer "dataset wall".
 */

interface Subject {
    src: string;
    id: string;
    match: string;
}

const SUBJECTS: Subject[] = [
    { src: "/gay-faces/trump.jpg", id: "0xA1", match: "98.4%" },
    { src: "/gay-faces/sam-altman.webp", id: "0x2F", match: "97.1%" },
    { src: "/gay-faces/trudeau.jpg", id: "0x9C", match: "99.2%" },
    { src: "/gay-faces/tim-cook.jpeg", id: "0x07", match: "99.9%" },
    { src: "/gay-faces/joginder.jpeg", id: "0xB3", match: "96.8%" },
    { src: "/gay-faces/two-men.png", id: "0xFF", match: "100%" },
    { src: "/gay-faces/mike-hearn.jpeg", id: "0xD4", match: "98.9%" },
];

function Card({ s }: { s: Subject }) {
    return (
        <figure className="group relative aspect-[4/5] w-40 shrink-0 overflow-hidden rounded-lg border border-hairline bg-night sm:w-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={s.src}
                alt="verified training subject"
                loading="lazy"
                className="evidence h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-2.5 pt-2">
                <span className="mono text-[10px] tracking-wider text-white/70">
                    SUBJ·{s.id}
                </span>
                <span className="h-1.5 w-1.5 animate-glow rounded-full bg-accent shadow-[0_0_6px_var(--color-accent)]" />
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between px-2.5 pb-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-alert/40 bg-alert/15 px-1.5 py-0.5 backdrop-blur-sm">
                    <span className="h-1 w-1 rounded-full bg-alert" />
                    <span className="mono text-[9px] font-semibold uppercase tracking-wider text-[#ff8a8a]">
                        Positive
                    </span>
                </span>
                <span className="mono text-[12px] font-medium tabular-nums text-white">
                    {s.match}
                </span>
            </figcaption>
        </figure>
    );
}

/** A single right-to-left scrolling row. */
export function MarqueeRow({
    durationSec = 36,
    offset = 0,
}: {
    durationSec?: number;
    offset?: number;
}) {
    // Rotate the list per row so stacked rows don't show identical faces in sync.
    const items = [...SUBJECTS.slice(offset), ...SUBJECTS.slice(0, offset)];
    return (
        <div className="edge-fade overflow-hidden">
            <div
                className="animate-marquee flex w-max gap-3 sm:gap-4"
                style={{ animationDuration: `${durationSec}s` }}
            >
                {[...items, ...items].map((s, i) => (
                    <Card key={`${s.id}-${i}`} s={s} />
                ))}
            </div>
        </div>
    );
}

/** Default: a two-row dataset wall, both scrolling right → left. */
export default function TrainingMarquee() {
    return (
        <div className="flex flex-col gap-3 sm:gap-4">
            <MarqueeRow durationSec={34} offset={0} />
            <MarqueeRow durationSec={46} offset={3} />
        </div>
    );
}
