import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateNarrative } from "@/lib/ai";
import { scorePosts } from "@/lib/scoring";
import { saveReport } from "@/lib/supabase";
import { enrichPostsWithInsights, getThreadsPosts, getThreadsProfile } from "@/lib/threads";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("tdna_threads_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Your Threads connection expired. Please connect again." },
      { status: 401 },
    );
  }

  try {
    const [profile, posts] = await Promise.all([
      getThreadsProfile(accessToken),
      getThreadsPosts(accessToken, 24),
    ]);

    if (!posts.length) {
      return NextResponse.json(
        { error: "We couldn't find any Threads posts to analyze." },
        { status: 422 },
      );
    }

    const enriched = await enrichPostsWithInsights(posts, accessToken);
    const { scores, signals, stats } = scorePosts(enriched);
    const narrative = await generateNarrative({
      username: profile.username,
      scores,
      stats,
      posts: enriched,
    });

    const saved = await saveReport({
      username: profile.username,
      displayName: profile.name ?? null,
      profilePictureUrl: profile.threads_profile_picture_url ?? null,
      postsAnalyzed: posts.length,
      archetype: narrative.archetype,
      strength: narrative.strength,
      weakness: narrative.weakness,
      summary: narrative.summary,
      scores,
      topSignals: signals,
    });

    const response = NextResponse.json({ reportId: saved.id });
    response.cookies.delete("tdna_threads_token");
    return response;
  } catch (error) {
    console.error("Analysis failed", error);
  
    const message =
      error instanceof Error
        ? error.message
        : "Unknown analysis error";
  
    const response = NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  
    response.cookies.delete("tdna_threads_token");
    return response;
  }
}
