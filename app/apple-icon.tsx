import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 60%, #ef4444 130%)",
          color: "#fafafa",
          fontSize: 100,
          fontWeight: 700,
          letterSpacing: -6,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        m
      </div>
    ),
    { ...size }
  );
}
