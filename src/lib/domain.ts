import { z } from "zod";
export const profileInput = z.object({
  display_name: z.string().trim().min(2).max(60),
  username: z.string().regex(/^[a-z0-9_]{3,24}$/),
  bio: z.string().max(300),
  is_public: z.boolean(),
});
export const commentInput = z.object({
  body: z.string().trim().min(2).max(2000),
  target: z.string().min(1).max(100),
  spoiler: z.boolean().default(false),
});
export function levelForXp(xp: number) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}
export function isEntitled(expires: string | null, now = Date.now()) {
  return !!expires && Date.parse(expires) > now;
}
export function safeRedirect(path: string | null) {
  return path?.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : "/";
}
export function adDue(
  completions: number,
  frequency: number,
  premium: boolean,
  exempt: boolean,
) {
  return (
    !premium &&
    !exempt &&
    frequency > 0 &&
    completions > 0 &&
    completions % frequency === 0
  );
}
export const categories = [
  ["anime", "Anime"],
  ["donghua", "Donghua"],
  ["drama-korea", "Drama Korea"],
  ["drama-china", "Drama China"],
  ["drama-jepang", "Drama Jepang"],
  ["drama-thailand", "Drama Thailand"],
  ["movies", "Film"],
  ["tv-series", "TV Series"],
] as const;
export type CatalogTitle = {
  id: string;
  provider: "anilist" | "tmdb" | "local";
  providerId: string;
  title: string;
  originalTitle?: string;
  description: string;
  poster: string;
  banner: string;
  year: number | null;
  score: number | null;
  genres: string[];
  country: string;
  status: string;
  episodes: number | null;
  url: string;
  playable: boolean;
};
