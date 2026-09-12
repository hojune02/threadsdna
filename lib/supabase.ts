import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/lib/env";
import type { Report } from "@/types/report";

function client() {
  const { url, serviceRoleKey } = requireSupabaseEnv();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function saveReport(report: Omit<Report, "id" | "createdAt">) {
  const { data, error } = await client()
    .from("reports")
    .insert({
      username: report.username,
      display_name: report.displayName,
      profile_picture_url: report.profilePictureUrl,
      posts_analyzed: report.postsAnalyzed,
      archetype: report.archetype,
      strength: report.strength,
      weakness: report.weakness,
      summary: report.summary,
      overall_score: report.scores.overall,
      conversation_score: report.scores.conversation,
      originality_score: report.scores.originality,
      authority_score: report.scores.authority,
      consistency_score: report.scores.consistency,
      virality_score: report.scores.virality,
      top_signals: report.topSignals,
      public: true,
    })
    .select("id, created_at")
    .single();

  if (error) throw new Error(`Could not save report: ${error.message}`);
  return { id: data.id as string, createdAt: data.created_at as string };
}

export async function getReport(id: string): Promise<Report | null> {
  const { data, error } = await client()
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("public", true)
    .maybeSingle();

  if (error) throw new Error(`Could not load report: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    profilePictureUrl: data.profile_picture_url,
    postsAnalyzed: data.posts_analyzed,
    archetype: data.archetype,
    strength: data.strength,
    weakness: data.weakness,
    summary: data.summary,
    scores: {
      overall: data.overall_score,
      conversation: data.conversation_score,
      originality: data.originality_score,
      authority: data.authority_score,
      consistency: data.consistency_score,
      virality: data.virality_score,
    },
    topSignals: data.top_signals ?? [],
    createdAt: data.created_at,
  };
}
