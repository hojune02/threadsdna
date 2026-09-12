"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { CSSProperties } from "react";
import type { Report, ScoreKey } from "@/types/report";
import { ThemeToggle } from "@/components/theme-toggle";

const LABELS: Record<ScoreKey, string> = {
  conversation: "Conversation",
  originality: "Originality",
  authority: "Authority",
  consistency: "Consistency",
  virality: "Virality",
};

export function ReportView({ report }: { report: Report }) {
  const [shared, setShared] = useState(false);
  const dimensions = Object.entries(LABELS) as Array<[ScoreKey, string]>;

  async function share() {
    const url = window.location.href;
    const text = `My Threads DNA is ${report.archetype} — ${report.scores.overall}/100. What's yours?`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "My Threads DNA", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }
    } catch {
      // User cancelled share sheet.
    }
  }

  return (
    <main className="report-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <nav className="topbar">
        <a className="brand" href="/">
          ThreadsDNA
        </a>

        <div className="topbar-actions">
          <a className="ghost-link" href="/">
            Analyze yours
          </a>

          <ThemeToggle />
        </div>
      </nav>

      <section className="report-grid">
        <motion.article
          className="hero-report glass"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="profile-row">
            <div className="avatar-shell">
              {report.profilePictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={report.profilePictureUrl} alt="" />
              ) : (
                <span>{report.username.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="profile-name">{report.displayName ?? `@${report.username}`}</p>
              <p className="handle">@{report.username} · {report.postsAnalyzed} posts analyzed</p>
            </div>
          </div>

          <div className="score-stage">
            <div className="score-ring" style={{ "--score": `${report.scores.overall * 3.6}deg` } as CSSProperties}>
              <div className="score-core">
                <strong>{report.scores.overall}</strong>
                <span>/ 100</span>
              </div>
            </div>
            <div className="archetype-block">
              <p className="eyebrow">Your Threads DNA</p>
              <h1>{report.archetype}</h1>
              <p>{report.summary}</p>
            </div>
          </div>

          <div className="dimension-list">
            {dimensions.map(([key, label], index) => (
              <div className="dimension" key={key}>
                <div className="dimension-head">
                  <span>{label}</span>
                  <strong>{report.scores[key]}</strong>
                </div>
                <div className="bar-track">
                  <motion.div
                    className="bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${report.scores[key]}%` }}
                    transition={{ duration: 0.7, delay: 0.15 + index * 0.08 }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button className="primary-button share-button" onClick={share}>
            {shared ? "Copied to clipboard ✓" : "Share my Threads DNA ↗"}
          </button>
        </motion.article>

        <aside className="report-side">
          <motion.section
            className="insight-card glass"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <p className="eyebrow">Strongest signal</p>
            <h2>What already works</h2>
            <p>{report.strength}</p>
          </motion.section>

          <motion.section
            className="insight-card glass"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
          >
            <p className="eyebrow">Growth edge</p>
            <h2>What to sharpen</h2>
            <p>{report.weakness}</p>
          </motion.section>

          <motion.section
            className="insight-card glass"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
          >
            <p className="eyebrow">Measured signals</p>
            <div className="signal-list">
              {report.topSignals.map((signal) => (
                <div className="signal" key={signal}>
                  <span className="signal-dot" />
                  <p>{signal}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </aside>
      </section>

      <footer className="report-footer">
        <p>Scores are directional product signals, not platform benchmarks.</p>
        <a href="/">Get your own DNA →</a>
      </footer>
    </main>
  );
}
