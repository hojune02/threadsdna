import "server-only";
import { z } from "zod";
import { env } from "@/lib/env";
import type { EnrichedPost, ScoreSet } from "@/types/report";

type AiNarrative = {
  archetype: string;
  strength: string;
  weakness: string;
  summary: string;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

const narrativeSchema = z.object({
  archetype: z.string().min(3).max(60),
  strength: z.string().min(1).max(240),
  weakness: z.string().min(1).max(240),
  summary: z.string().min(1).max(300),
});

function fallback(scores: ScoreSet): AiNarrative {
  const ranked = Object.entries(scores)
    .filter(([key]) => key !== "overall")
    .sort((a, b) => b[1] - a[1]);
  const strongest = ranked[0]?.[0] ?? "conversation";
  const weakest = ranked.at(-1)?.[0] ?? "consistency";
  const archetype =
    strongest === "authority"
      ? "THE GUIDE"
      : strongest === "originality"
        ? "THE ORIGINAL"
        : strongest === "virality"
          ? "THE SPARK"
          : strongest === "consistency"
            ? "THE OPERATOR"
            : "THE CONVERSATIONALIST";

  return {
    archetype,
    strength: `Your strongest measured trait is ${strongest}. Your recent posts consistently show more strength here than across your other dimensions.`,
    weakness: `Your biggest opportunity is ${weakest}. Improving this dimension is the clearest way to make the account more balanced.`,
    summary: `Your Threads DNA is strongest in ${strongest} and currently scores ${scores.overall}/100 overall. The next step is to preserve what already works while deliberately improving ${weakest}.`,
  };
}

function extractGeminiText(response: GeminiGenerateContentResponse): string {
  return (response.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

function normalizeNarrative(value: z.infer<typeof narrativeSchema>): AiNarrative {
  let archetype = value.archetype.trim().toUpperCase();
  if (!archetype.startsWith("THE ")) archetype = `THE ${archetype}`;

  return {
    archetype: archetype.slice(0, 60),
    strength: value.strength.trim(),
    weakness: value.weakness.trim(),
    summary: value.summary.trim(),
  };
}

export async function generateNarrative(args: {
  username: string;
  scores: ScoreSet;
  stats: Record<string, number>;
  posts: EnrichedPost[];
}): Promise<AiNarrative> {
  if (!env.GEMINI_API_KEY) return fallback(args.scores);

  // Keep the AI payload intentionally small. The scoring engine has already
  // computed the quantitative result; Gemini only writes the interpretation.
  const samples = args.posts
    .flatMap((post) => {
      const text = post.text?.trim();
      if (!text) return [];
      return [{
        text: text.slice(0, 500),
        likes: post.insights.likes,
        replies: post.insights.replies,
        reposts: post.insights.reposts,
        quotes: post.insights.quotes,
        views: post.insights.views,
      }];
    })
    .slice(0, 18);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "You are a concise social-content analyst. Use only the supplied metrics and post samples. Do not invent audience demographics, causes, benchmarks, follower counts, or performance claims. The numerical scores are authoritative and must not be changed. Archetype must be 2-4 words in uppercase and begin with THE. Strength and weakness must each be under 240 characters. Summary must be under 300 characters.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: JSON.stringify({
                  username: args.username,
                  scores: args.scores,
                  computed_stats: args.stats,
                  recent_posts: samples,
                }),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              archetype: { type: "STRING" },
              strength: { type: "STRING" },
              weakness: { type: "STRING" },
              summary: { type: "STRING" },
            },
            required: ["archetype", "strength", "weakness", "summary"],
          },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      console.error("Gemini narrative request failed", response.status, await response.text());
      return fallback(args.scores);
    }

    const body = (await response.json()) as GeminiGenerateContentResponse;
    const text = extractGeminiText(body);
    if (!text) return fallback(args.scores);

    const parsed = narrativeSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      console.error("Gemini narrative did not match schema", parsed.error.flatten());
      return fallback(args.scores);
    }

    return normalizeNarrative(parsed.data);
  } catch (error) {
    console.error("Gemini narrative generation failed", error);
    return fallback(args.scores);
  }
}
