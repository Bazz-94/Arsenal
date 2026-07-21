import type { SteamProfile } from "@/src/app/_lib/steam/types";

/**
 * A Steam profile as used within the Steam Intersect tool, distinguishing
 * the resolved user's own profile from their friends.
 */
export interface Profile extends SteamProfile {
  /** True when this profile is the current user's profile. */
  isUser: boolean;
}
