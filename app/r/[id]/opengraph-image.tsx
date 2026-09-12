import { ImageResponse } from "next/og";
import { demoReport } from "@/lib/demo";
import { getReport } from "@/lib/supabase";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = id === "demo" ? demoReport : await getReport(id);

  if (!report) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", background: "#090b0a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72 }}>
        THREADDNA
      </div>,
      size,
    );
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "radial-gradient(circle at 75% 20%, #1d3d2b 0%, #0a0d0b 42%, #050605 100%)",
        color: "#f4fff7",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 30, letterSpacing: "0.22em", fontWeight: 700 }}>THREAD<span style={{ color: "#70ff9b" }}>DNA</span></div>
        <div style={{ fontSize: 26, color: "#9bb2a2" }}>@{report.username}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 62 }}>
        <div style={{ width: 230, height: 230, borderRadius: 999, border: "8px solid #70ff9b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 0 80px rgba(112,255,155,.18)" }}>
          <div style={{ fontSize: 92, lineHeight: 1, fontWeight: 800 }}>{report.scores.overall}</div>
          <div style={{ fontSize: 22, color: "#a9b9ae" }}>/ 100</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 690 }}>
          <div style={{ color: "#70ff9b", letterSpacing: "0.18em", fontSize: 22, marginBottom: 18 }}>YOUR THREADS DNA</div>
          <div style={{ fontSize: 66, lineHeight: 1.02, fontWeight: 800 }}>{report.archetype}</div>
          <div style={{ fontSize: 26, lineHeight: 1.4, color: "#bed0c3", marginTop: 22 }}>{report.summary}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 28, color: "#b8c9bd", fontSize: 22 }}>
        <span>Conversation {report.scores.conversation}</span>
        <span>·</span>
        <span>Originality {report.scores.originality}</span>
        <span>·</span>
        <span>Virality {report.scores.virality}</span>
      </div>
    </div>,
    size,
  );
}
