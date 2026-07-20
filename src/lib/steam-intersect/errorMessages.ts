import type { LookupErrorCode } from "@/src/lib/steam-intersect/lookupProfiles";

/** User-facing message per lookup error code. */
export const ERROR_MESSAGES: Record<LookupErrorCode, string> = {
  "invalid-input":
    "That doesn't look like a Steam profile. Enter a vanity name, a 17-digit SteamID64, or a steamcommunity.com profile URL.",
  "not-found": "No Steam profile found for that name or ID. Check it and try again.",
  "private-list":
    "That profile's friend list is private, so friends can't be listed. Make the friend list public and try again.",
  "api-failure": "Steam couldn't be reached. Try again in a moment.",
};
