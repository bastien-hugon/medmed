import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 280,
          fontWeight: 700,
          letterSpacing: -20,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        m
      </div>
    ),
    { ...size }
  );
}
