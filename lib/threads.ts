import "server-only";
import type {
  EnrichedPost,
  PostInsights,
  ThreadsPost,
  ThreadsProfile,
} from "@/types/report";

const API = "https://graph.threads.net";
const POST_FIELDS = [
  "id",
  "text",
  "timestamp",
  "permalink",
  "media_type",
  "is_quote_post",
  "has_replies",
].join(",");

async function threadsFetch<T>(path: string, accessToken: string): Promise<T> {
  const url = new URL(`${API}${path}`);
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Threads API ${response.status}: ${body.slice(0, 500)}`);
  }

  return (await response.json()) as T;
}

export async function getThreadsProfile(accessToken: string) {
  return threadsFetch<ThreadsProfile>(
    "/me?fields=id,username,name,threads_profile_picture_url,threads_biography",
    accessToken,
  );
}

export async function getThreadsPosts(accessToken: string, limit = 24) {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const result = await threadsFetch<{ data: ThreadsPost[] }>(
    `/me/threads?fields=${encodeURIComponent(POST_FIELDS)}&limit=${safeLimit}`,
    accessToken,
  );
  return result.data ?? [];
}

function readMetric(
  data: Array<{ name: string; values?: Array<{ value?: number }> }>,
  name: keyof PostInsights,
) {
  const metric = data.find((item) => item.name === name);
  const value = metric?.values?.[0]?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function getPostInsights(
  postId: string,
  accessToken: string,
): Promise<PostInsights> {
  const read = async (metrics: string) =>
    threadsFetch<{
      data: Array<{ name: string; values?: Array<{ value?: number }> }>;
    }>(`/${postId}/insights?metric=${metrics}`, accessToken);

  try {
    let result;
    try {
      result = await read("views,likes,replies,reposts,quotes,shares");
    } catch {
      // Newer/development metrics are not guaranteed on every account/post.
      result = await read("likes,replies,reposts,quotes");
    }

    return {
      views: readMetric(result.data ?? [], "views"),
      likes: readMetric(result.data ?? [], "likes"),
      replies: readMetric(result.data ?? [], "replies"),
      reposts: readMetric(result.data ?? [], "reposts"),
      quotes: readMetric(result.data ?? [], "quotes"),
      shares: readMetric(result.data ?? [], "shares"),
    };
  } catch {
    return { views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0, shares: 0 };
  }
}

export async function enrichPostsWithInsights(
  posts: ThreadsPost[],
  accessToken: string,
): Promise<EnrichedPost[]> {
  const result: EnrichedPost[] = [];
  const concurrency = 8;

  for (let i = 0; i < posts.length; i += concurrency) {
    const batch = posts.slice(i, i + concurrency);
    const enriched = await Promise.all(
      batch.map(async (post) => ({
        ...post,
        insights: await getPostInsights(post.id, accessToken),
      })),
    );
    result.push(...enriched);
  }

  return result;
}
