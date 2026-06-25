import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const alt = `${SITE_NAME} — AI Facial Inference Engine`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mirrors the app's dark "surveillance" chrome (see globals.css):
// near-black canvas, a single cool cyan→indigo accent, mono telemetry.
export default function OpengraphImage() {
  const mesh = "linear-gradient(120deg, #22d3ee 0%, #3b82f6 52%, #818cf8 100%)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#08080a",
          backgroundImage:
            "radial-gradient(900px 500px at 78% -10%, rgba(34,211,238,0.18), rgba(8,8,10,0) 60%)",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* top row: brand mark + status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "9px",
                backgroundImage: mesh,
              }}
            />
            <div
              style={{ fontSize: "26px", fontWeight: 600, color: "#fafafa" }}
            >
              {SITE_NAME}
            </div>
          </div>
          <div
            style={{
              fontSize: "18px",
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: "#6b6b76",
            }}
          >
            System online
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "20px",
              letterSpacing: "5px",
              textTransform: "uppercase",
              color: "#22d3ee",
              marginBottom: "22px",
            }}
          >
            Classified · AI facial analysis
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "108px",
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "-3px",
            }}
          >
            <span style={{ color: "#fafafa" }}>Your face, </span>
            <span
              style={{
                marginLeft: "22px",
                backgroundImage: mesh,
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              analyzed.
            </span>
          </div>
          <div
            style={{
              fontSize: "30px",
              color: "#a1a1aa",
              marginTop: "30px",
              maxWidth: "880px",
              lineHeight: 1.35,
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>

        {/* footer telemetry */}
        <div
          style={{
            display: "flex",
            gap: "44px",
            fontSize: "20px",
            color: "#6b6b76",
            letterSpacing: "1px",
          }}
        >
          <div style={{ display: "flex" }}>478 facial landmarks</div>
          <div style={{ display: "flex" }}>98.69% validation accuracy</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
