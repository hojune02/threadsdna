import type { EnrichedPost, ScoreSet } from "@/types/report";
import { clamp, mean, stdDev } from "@/lib/utils";

type ScoreResult = {
  scores: ScoreSet;
  signals: string[];
  stats: Record<string, number>;
};

const authorityTerms = /\b(how|why|because|lesson|learned|framework|guide|steps?|result|tested|experiment|data|mistake|strategy)\b/i;

function words(text: string) {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

export function scorePosts(posts: EnrichedPost[]): ScoreResult {
  const usable = posts.filter((post) => (post.text ?? "").trim().length > 0);
  if (!usable.length) {
    const scores = {
      overall: 50,
      conversation: 50,
      originality: 50,
      authority: 50,
      consistency: 50,
      virality: 50,
    };
    return { scores, signals: ["Not enough text posts to establish a strong pattern"], stats: {} };
  }

  const replyCounts = usable.map((p) => p.insights.replies);
  const likes = usable.map((p) => p.insights.likes);
  const reposts = usable.map((p) => p.insights.reposts + p.insights.quotes + p.insights.shares);
  const views = usable.map((p) => p.insights.views);
  const totalEngagement = usable.map(
    (p) => p.insights.likes + p.insights.replies + p.insights.reposts + p.insights.quotes + p.insights.shares,
  );

  const questionRatio = mean(
    usable.map((p) => ((p.text ?? "").includes("?") ? 1 : 0)),
  );
  const conversationShare =
    replyCounts.reduce((a, b) => a + b, 0) /
    Math.max(1, totalEngagement.reduce((a, b) => a + b, 0));
  const conversation = clamp(38 + questionRatio * 25 + Math.min(1, conversationShare * 4) * 37);

  const allWords = usable.flatMap((p) => words(p.text ?? ""));
  const uniqueRatio = new Set(allWords).size / Math.max(1, allWords.length);
  const normalizedTexts = usable.map((p) =>
    (p.text ?? "")
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
  const duplicatePenalty = 1 - new Set(normalizedTexts).size / normalizedTexts.length;
  const originality = clamp(35 + uniqueRatio * 85 - duplicatePenalty * 45);

  const authorityRatio = mean(
    usable.map((p) => (authorityTerms.test(p.text ?? "") ? 1 : 0)),
  );
  const evidenceRatio = mean(
    usable.map((p) => (/\d/.test(p.text ?? "") ? 1 : 0)),
  );
  const avgLength = mean(usable.map((p) => (p.text ?? "").length));
  const authority = clamp(
    35 + authorityRatio * 35 + evidenceRatio * 18 + Math.min(avgLength / 500, 1) * 12,
  );

  const timestamps = usable
    .map((p) => (p.timestamp ? new Date(p.timestamp).getTime() : NaN))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const intervalsDays = timestamps
    .slice(1)
    .map((time, index) => Math.max(0.02, (time - timestamps[index]) / 86_400_000));
  const intervalMean = mean(intervalsDays);
  const intervalCv = intervalMean > 0 ? stdDev(intervalsDays) / intervalMean : 1;
  const postingFrequencyScore = intervalMean > 0 ? Math.min(1, 2 / intervalMean) : 0.5;
  const regularityScore = Math.max(0, 1 - Math.min(intervalCv, 1.5) / 1.5);
  const consistency = clamp(30 + postingFrequencyScore * 40 + regularityScore * 30);

  const repostShare =
    reposts.reduce((a, b) => a + b, 0) /
    Math.max(1, totalEngagement.reduce((a, b) => a + b, 0));
  const viewSignal = mean(views.map((v) => Math.log10(v + 1))) / 5;
  const likeSignal = mean(likes.map((v) => Math.log10(v + 1))) / 4;
  const virality = clamp(
    35 + Math.min(1, repostShare * 5) * 35 + Math.min(1, viewSignal) * 18 + Math.min(1, likeSignal) * 12,
  );

  const overall = clamp(
    conversation * 0.25 + originality * 0.2 + authority * 0.15 + consistency * 0.15 + virality * 0.25,
  );

  const scores = { overall, conversation, originality, authority, consistency, virality };
  const sorted = Object.entries(scores)
    .filter(([key]) => key !== "overall")
    .sort((a, b) => b[1] - a[1]);

  const signals = [
    `${sorted[0][0][0].toUpperCase()}${sorted[0][0].slice(1)} is your strongest measured dimension`,
    questionRatio >= 0.25
      ? "You frequently create explicit openings for replies"
      : "You rarely end posts with explicit conversational openings",
    repostShare >= 0.12
      ? "A meaningful share of engagement comes from reposts, quotes, or shares"
      : "Most measured engagement stays in likes/replies rather than redistribution",
  ];

  return {
    scores,
    signals,
    stats: {
      posts: usable.length,
      avgReplies: Number(mean(replyCounts).toFixed(2)),
      avgLikes: Number(mean(likes).toFixed(2)),
      avgViews: Number(mean(views).toFixed(2)),
      questionRatio: Number(questionRatio.toFixed(3)),
      repostShare: Number(repostShare.toFixed(3)),
      avgCharacters: Number(avgLength.toFixed(1)),
    },
  };
}
