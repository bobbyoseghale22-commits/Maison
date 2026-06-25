import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Maison Noir — Considered Menswear";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default Open Graph / Twitter card image for the root domain.
 * Rendered as a PNG via Next.js's edge ImageResponse (Satori).
 *
 * Product and category pages generate their own OG images via the
 * Cloudinary URL returned from the DB, set in generateMetadata().
 * This file is the fallback for pages that don't set an explicit OG image.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0A0A",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Thin border inset */}
        <div
          style={{
            position: "absolute",
            inset: 32,
            border: "1px solid rgba(250,250,248,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            fontSize: 72,
            fontStyle: "italic",
            color: "#FAFAF8",
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          Maison Noir
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 24,
            fontSize: 20,
            color: "rgba(250,250,248,0.45)",
            letterSpacing: "4px",
            textTransform: "uppercase",
            fontFamily: "Helvetica, Arial, sans-serif",
            fontStyle: "normal",
            fontWeight: 400,
          }}
        >
          Considered Menswear
        </div>
      </div>
    ),
    { ...size },
  );
}
