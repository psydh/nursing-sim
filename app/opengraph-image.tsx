import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "세명대학교 간호학과 정신간호 시뮬레이션";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#f0f4fa",
        }}
      >
        {/* 상단 헤더 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1a4a96",
            color: "white",
            padding: "20px",
            height: "90px",
          }}
        >
          <span style={{ fontSize: 16, letterSpacing: "0.15em", opacity: 0.8 }}>
            SEMYUNG UNIVERSITY
          </span>
          <span style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
            세명대학교 간호학과
          </span>
        </div>

        {/* 본문 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            gap: 24,
            padding: "40px",
          }}
        >
          {/* 아이콘 원 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 120,
              height: 120,
              borderRadius: "50%",
              backgroundColor: "#1a4a96",
              fontSize: 60,
            }}
          >
            🏥
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 56, fontWeight: 800, color: "#1a4a96" }}>
              정신간호 시뮬레이션
            </span>
            <span style={{ fontSize: 26, color: "#6b7280" }}>
              AI 환자와의 대화형 임상 실습 플랫폼
            </span>
          </div>

          {/* 하단 태그 */}
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            {["🧠 MSE 사정", "📋 입·퇴원 절차", "💊 정신간호중재"].map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  backgroundColor: "white",
                  borderRadius: 100,
                  padding: "8px 24px",
                  fontSize: 20,
                  color: "#1a4a96",
                  fontWeight: 600,
                  border: "2px solid #dbeafe",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* 하단 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backgroundColor: "white",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <span style={{ fontSize: 18, color: "#9ca3af" }}>
            세명대학교 간호학과 임상실습 지원 시스템
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
