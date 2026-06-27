import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#fafafa",
            fontSize: 18,
            fontStyle: "italic",
            fontFamily: "serif",
            fontWeight: 600,
            letterSpacing: "-0.5px",
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size },
  );
}
