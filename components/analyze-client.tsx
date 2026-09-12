"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const phases = [
  "Reading your recent posts",
  "Measuring conversation signals",
  "Mapping your creator DNA",
  "Writing your profile",
];

export function AnalyzeClient() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPhase((value) => Math.min(value + 1, phases.length - 1));
    }, 1300);

    void (async () => {
      try {
        const response = await fetch("/api/analyze", { method: "POST" });
        const body = (await response.json()) as { reportId?: string; error?: string };
        if (!response.ok || !body.reportId) {
          throw new Error(body.error ?? "Analysis failed.");
        }
        router.replace(`/r/${body.reportId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed.");
      }
    })();

    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <main className="analysis-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="analysis-card">
        <motion.div
          className="dna-orb"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <div className="dna-orb-inner" />
        </motion.div>
        <p className="eyebrow">THREADSDNA / LIVE ANALYSIS</p>
        <h1>{error ? "Analysis interrupted" : "Reading your signal."}</h1>
        {error ? (
          <>
            <p className="analysis-copy">{error}</p>
            <a className="primary-button" href="/">
              Return home
            </a>
          </>
        ) : (
          <>
            <p className="analysis-copy">{phases[phase]}…</p>
            <div className="progress-track" aria-label="Analysis progress">
              <motion.div
                className="progress-fill"
                animate={{ width: `${25 + phase * 22}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="microcopy">Usually finishes after the API and AI analysis complete.</p>
          </>
        )}
      </section>
    </main>
  );
}
