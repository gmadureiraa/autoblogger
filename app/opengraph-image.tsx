import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "AutoBlogger | Blog com IA que se auto-alimenta 24/7"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0f0f0f",
          color: "#f5ecd5",
          fontFamily: "monospace",
          padding: "72px",
          position: "relative",
          backgroundImage:
            "radial-gradient(rgba(245,236,213,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f0f0f",
              fontWeight: 900,
              fontSize: "28px",
            }}
          >
            A
          </div>
          <div
            style={{
              fontSize: "18px",
              letterSpacing: "4px",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            AutoBlogger
          </div>
        </div>

        <div
          style={{
            fontSize: "92px",
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: "-2px",
            textTransform: "uppercase",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Seu blog</span>
          <span>produzindo</span>
          <span>
            sozinho. <span style={{ color: "#10b981" }}>24/7.</span>
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "72px",
            left: "72px",
            right: "72px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "16px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "rgba(245,236,213,0.6)",
            borderTop: "1px solid rgba(245,236,213,0.2)",
            paddingTop: "24px",
          }}
        >
          <span>Blog com IA / SEO automatico / Setup 48h</span>
          <span style={{ color: "#10b981" }}>kaleidos</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
