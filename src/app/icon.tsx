import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
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
          background: "#FBFAF6",
          color: "#1F1E1B",
          fontSize: 100,
          fontWeight: 700,
          letterSpacing: -4,
          fontFamily: "system-ui",
          borderRadius: 32,
        }}
      >
        <span>L</span>
        <span style={{ color: "#1F1E1B" }}>G</span>
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            background: "#4A6B5B",
            marginLeft: 6,
            marginBottom: 64,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
