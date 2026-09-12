export type ScoreKey =
  | "conversation"
  | "originality"
  | "authority"
  | "consistency"
  | "virality";

export type ScoreSet = Record<ScoreKey, number> & { overall: number };

export type Report = {
  id: string;
  username: string;
  displayName: string | null;
  profilePictureUrl: string | null;
  postsAnalyzed: number;
  archetype: string;
  strength: string;
  weakness: string;
  summary: string;
  scores: ScoreSet;
  topSignals: string[];
  createdAt: string;
};

export type ThreadsProfile = {
  id: string;
  username: string;
  name?: string;
  threads_profile_picture_url?: string;
  threads_biography?: string;
};

export type ThreadsPost = {
  id: string;
  text?: string;
  timestamp?: string;
  permalink?: string;
  media_type?: string;
  is_quote_post?: boolean;
  has_replies?: boolean;
};

export type PostInsights = {
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
};

export type EnrichedPost = ThreadsPost & { insights: PostInsights };
