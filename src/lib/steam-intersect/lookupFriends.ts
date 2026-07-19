import { parseSteamIdentity } from "../shared/steam/identity";
import { SteamApiError, type SteamErrorCode, type SteamProfile } from "../shared/steam/types";
import type { SteamApiClient } from "../shared/steam/client";

/** Failure categories for a friends lookup, including bad user input. */
export type LookupErrorCode = SteamErrorCode | "invalid-input";

/** Result of resolving a Steam identity and fetching its friend list. */
export type LookupFriendsResult =
  | {
      /** Discriminator: the lookup succeeded. */
      ok: true;
      /** The resolved user, shaped like a friend so it can be selected. */
      self: SteamProfile;
      /** The user's friends with name, avatar, and privacy flag. */
      friends: SteamProfile[];
    }
  | {
      /** Discriminator: the lookup failed. */
      ok: false;
      /** Why the lookup failed. */
      error: LookupErrorCode;
    };

/**
 * Resolves user input (vanity name, SteamID64, or profile URL) to a
 * SteamID64, then fetches the user's friend list with display data.
 *
 * @param client Steam API client to call.
 * @param input Raw identity text the user entered.
 * @returns Self + friends on success, or a typed error: `invalid-input`
 * (unparseable), `not-found` (vanity or id doesn't exist), `private-list`
 * (friend list hidden), `api-failure` (Steam unreachable).
 */
export async function lookupFriends(
  client: SteamApiClient,
  input: string
): Promise<LookupFriendsResult> {
  try {
    const identity = parseSteamIdentity(input);
    if (!identity) return { ok: false, error: "invalid-input" };

    let steamId: string;
    if (identity.kind === "vanity") {
      const resolved = await client.resolveVanityUrl(identity.vanityName);
      if (!resolved) return { ok: false, error: "not-found" };
      steamId = resolved;
    } else {
      steamId = identity.steamId;
    }

    const friendIds = await client.getFriendIds(steamId);
    const profiles = await client.getPlayerSummaries([steamId, ...friendIds]);

    const self = profiles.find(profile => profile.steamId === steamId);
    // Steam returns nothing for ids that don't exist.
    if (!self) return { ok: false, error: "not-found" };

    return {
      ok: true,
      self: { ...self, isUser: true },
      friends: profiles.filter(profile => profile.steamId !== steamId),
    };
  } catch (error) {
    if (error instanceof SteamApiError) {
      return { ok: false, error: error.code };
    }
    return { ok: false, error: "api-failure" };
  }
}
