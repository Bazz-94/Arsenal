/**
 * A Steam profile: the resolved user or one of their friends.
 */
export type SteamProfile = {
  /** The person's SteamID64 (17-digit numeric id). */
  steamId: string;
  /** Steam display name (persona name). */
  name: string;
  /** Absolute URL of the full-size avatar image. */
  avatarUrl: string;
  /** True when the profile is not public (communityvisibilitystate != 3). */
  isPrivate: boolean;
  /** Raw Steam `personastate` value (online/busy/away/etc). */
  personaState: number;
  /** Unix timestamp (seconds) of the last logoff, or `null` when Steam didn't report one. */
  lastLogoff: number | null;
};

/** Label shown for each Steam `personastate` value. */
export const PERSONA_STATE_LABELS: Record<number, string> = {
  0: "Offline",
  1: "Online",
  2: "Busy",
  3: "Away",
  4: "Snooze",
  5: "Looking to trade",
  6: "Looking to play",
};

/** Tailwind text color class for each Steam `personastate` value. */
export const PERSONA_STATE_COLORS: Record<number, string> = {
  0: "text-foreground/50",
  1: "text-green-500",
  2: "text-red-500",
  3: "text-yellow-500",
  4: "text-yellow-500",
  5: "text-blue-500",
  6: "text-blue-500",
};

/** Longest-to-shortest unit steps used by `formatOfflineDuration`. */
const DURATION_UNITS: Array<{ label: string; seconds: number }> = [
  { label: "year", seconds: 60 * 60 * 24 * 365 },
  { label: "month", seconds: 60 * 60 * 24 * 30 },
  { label: "day", seconds: 60 * 60 * 24 },
  { label: "hour", seconds: 60 * 60 },
  { label: "minute", seconds: 60 },
];

/**
 * Formats how long ago `lastLogoff` was, relative to `now`, as e.g.
 * "3 hours" or "1 day". Rounds down to the largest whole unit; anything
 * under a minute reports "just now".
 *
 * @param lastLogoff Unix timestamp (seconds) of the last logoff.
 * @param now Current time; defaults to `Date.now()`.
 */
export function formatOfflineDuration(lastLogoff: number, now: number = Date.now()): string {
  const elapsedSeconds = Math.max(0, Math.floor(now / 1000) - lastLogoff);

  for (const unit of DURATION_UNITS) {
    const value = Math.floor(elapsedSeconds / unit.seconds);
    if (value >= 1) return `${value} ${unit.label}${value === 1 ? "" : "s"}`;
  }
  return "just now";
}

/** One game from a Steam library. */
export type SteamGame = {
  /** The game's Steam application id. */
  appid: number;
  /** The game's display name. */
  name: string;
  /** Absolute URL of the game's small icon, or `null` when Steam has none. */
  iconUrl: string | null;
};

/**
 * Machine-readable failure categories surfaced to callers:
 * - `not-found` — the entered identity could not be resolved.
 * - `private-list` — the user's own friend list is not visible.
 * - `api-failure` — Steam API unreachable or returned an error status.
 */
export type SteamErrorCode = "not-found" | "private-list" | "api-failure";

/** Error thrown by the Steam client, tagged with a `SteamErrorCode`. */
export class SteamApiError extends Error {
  /**
   * @param code Machine-readable failure category.
   * @param message Human-readable detail for logs.
   */
  constructor(
    /** Machine-readable failure category. */
    public readonly code: SteamErrorCode,
    message: string
  ) {
    super(message);
    this.name = "SteamApiError";
  }
}
