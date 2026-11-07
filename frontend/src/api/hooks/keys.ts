/** React Query cache keys, in one place so mutations invalidate the right lists. */
export const keys = {
  profile: (userId: string) => ["profile", userId] as const,
  posters: ["posters"] as const,
  posterList: (scope: string) => ["posters", "list", scope] as const,
  poster: (id: string) => ["posters", "detail", id] as const,
  rules: ["rules"] as const,
  brandKit: ["rulebook", "brand-kit"] as const,
  courses: ["rulebook", "courses"] as const,
  resultStats: ["rulebook", "result-stats"] as const,
  toppers: ["rulebook", "toppers"] as const,
  branches: ["branches"] as const,
  insights: ["insights"] as const,
  audit: ["audit"] as const,
};
