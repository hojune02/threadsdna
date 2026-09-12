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
        THREADSDNA
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
  
        background: "#ffffff",
        color: "#0a0a0a",
  
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: "-0.04em",
            fontWeight: 700,
          }}
        >
          ThreadDNA
        </div>
  
        <div
          style={{
            fontSize: 25,
            color: "#777777",
          }}
        >
          @{report.username}
        </div>
      </div>
  
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 62,
        }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: 999,
            border: "7px solid #0a0a0a",
  
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 88,
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: "-0.06em",
            }}
          >
            {report.scores.overall}
          </div>
  
          <div
            style={{
              fontSize: 20,
              color: "#777777",
            }}
          >
            / 100
          </div>
        </div>
  
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 690,
          }}
        >
          <div
            style={{
              color: "#777777",
              fontSize: 21,
              marginBottom: 15,
            }}
          >
            Your Threads DNA
          </div>
  
          <div
            style={{
              fontSize: 63,
              lineHeight: 1.02,
              fontWeight: 700,
              letterSpacing: "-0.05em",
            }}
          >
            {report.archetype}
          </div>
  
          <div
            style={{
              fontSize: 25,
              lineHeight: 1.4,
              color: "#555555",
              marginTop: 20,
            }}
          >
            {report.summary}
          </div>
        </div>
      </div>
  
      <div
        style={{
          display: "flex",
          gap: 26,
          color: "#777777",
          fontSize: 21,
        }}
      >
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
