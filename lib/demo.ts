import type { Report } from "@/types/report";

export const demoReport: Report = {
  id: "demo",
  username: "buildwithalex",
  displayName: "Alex Chen",
  profilePictureUrl: null,
  postsAnalyzed: 24,
  archetype: "THE BUILDER",
  strength:
    "You turn work-in-progress into conversations. Your strongest posts reveal the process instead of only announcing the outcome.",
  weakness:
    "Your educational posts often resolve the tension too quickly. Leave a sharper information gap or a stronger opinion for readers to react to.",
  summary:
    "Your account has strong builder energy: practical, specific, and easy to trust. The biggest growth unlock is making your useful posts more conversational without losing substance.",
  scores: {
    overall: 84,
    conversation: 88,
    originality: 86,
    authority: 77,
    consistency: 79,
    virality: 89,
  },
  topSignals: [
    "Question-led posts generate more replies",
    "Build-in-public posts are your strongest format",
    "Shorter posts create more repost activity",
  ],
  createdAt: new Date().toISOString(),
};
