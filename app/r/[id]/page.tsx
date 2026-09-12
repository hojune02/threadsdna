import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/report-view";
import { demoReport } from "@/lib/demo";
import { env } from "@/lib/env";
import { getReport } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function loadReport(id: string) {
  if (id === "demo") return demoReport;
  return getReport(id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const report = await loadReport(id);
  if (!report) return {};

  const title = `@${report.username} is ${report.archetype} · ${report.scores.overall}/100`;
  const description = report.summary;

  return {
    title,
    description,
    alternates: { canonical: `${env.NEXT_PUBLIC_APP_URL}/r/${id}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${env.NEXT_PUBLIC_APP_URL}/r/${id}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await loadReport(id);
  if (!report) notFound();
  return <ReportView report={report} />;
}
