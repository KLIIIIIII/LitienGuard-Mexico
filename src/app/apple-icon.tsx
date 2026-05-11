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
          background: "#FBFAF6",
          color: "#1F1E1B",
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: -3,
          fontFamily: "system-ui",
        }}
      >
        <span>L</span>
        <span style={{ color: "#1F1E1B" }}>G</span>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            background: "#4A6B5B",
            marginLeft: 5,
            marginBottom: 60,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
