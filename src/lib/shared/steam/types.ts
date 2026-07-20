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
};

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
