import type { SteamApiClient } from "../shared/steam/client";
import { SteamApiError, type SteamGame, type SteamProfile } from "../shared/steam/types";

/** Why a profile was left out of the intersection. */
export type ExclusionReason = "private" | "unavailable";

/** One profile that couldn't be included in the intersection. */
export type ExcludedProfile = {
  /** Display name if resolved, otherwise the raw SteamID64. */
  label: string;
  /** Why the profile was excluded. */
  reason: ExclusionReason;
};

/** Result of computing the common-games intersection for a set of ids. */
export type CommonGamesResult =
  | {
      /** Discriminator: at least one profile resolved and had a library. */
      ok: true;
      /** Profiles whose library was readable and factored into `games`. */
      profiles: SteamProfile[];
      /** Games owned by every included profile, sorted alphabetically. */
      games: SteamGame[];
      /** Profiles left out of the intersection, if any. */
      excluded: ExcludedProfile[];
    }
  | {
      /** Discriminator: every profile was excluded. */
      ok: false;
      /** Every profile, all excluded. */
      excluded: ExcludedProfile[];
    };

/**
 * Fetches owned-games libraries for the given SteamID64s and computes the
 * games common to everyone whose library could be read. Profiles that
 * can't be resolved or whose library isn't visible are excluded rather
 * than failing the whole lookup.
 *
 * @param client Steam API client to call.
 * @param steamIds SteamID64s to include in the intersection.
 * @returns The common games (empty when nobody shares any) plus the
 * excluded profiles, or `ok: false` when every id was excluded.
 */
export async function getCommonGames(
  client: SteamApiClient,
  steamIds: string[]
): Promise<CommonGamesResult> {
  let summaries;
  try {
    summaries = await client.getPlayerSummaries(steamIds);
  } catch (error) {
    if (!(error instanceof SteamApiError)) throw error;
    return {
      ok: false,
      excluded: steamIds.map(steamId => ({ label: steamId, reason: "unavailable" })),
    };
  }
  const profileById = new Map(summaries.map(profile => [profile.steamId, profile]));

  const results = await Promise.all(
    steamIds.map(async steamId => {
      const profile = profileById.get(steamId);
      if (!profile) {
        return { excluded: { label: steamId, reason: "unavailable" as const } };
      }

      let games;
      try {
        games = await client.getOwnedGames(steamId);
      } catch (error) {
        if (!(error instanceof SteamApiError)) throw error;
        return { excluded: { label: profile.name, reason: "unavailable" as const } };
      }
      if (!games) {
        return {
          excluded: {
            label: profile.name,
            reason: (profile.isPrivate ? "private" : "unavailable") as ExclusionReason,
          },
        };
      }

      return { included: { profile, games } };
    })
  );

  const excluded = results.flatMap(result => (result.excluded ? [result.excluded] : []));
  const included = results.flatMap(result => (result.included ? [result.included] : []));

  if (included.length === 0) {
    return { ok: false, excluded };
  }

  const [first, ...rest] = included;
  let commonAppIds = new Set(first.games.map(game => game.appid));
  for (const entry of rest) {
    const appIds = new Set(entry.games.map(game => game.appid));
    commonAppIds = new Set([...commonAppIds].filter(appId => appIds.has(appId)));
  }

  const gameByAppId = new Map<number, SteamGame>();
  for (const entry of included) {
    for (const game of entry.games) {
      if (!gameByAppId.has(game.appid)) gameByAppId.set(game.appid, game);
    }
  }

  const games = [...commonAppIds]
    .map(appId => gameByAppId.get(appId)!)
    .sort((a, b) => a.name.localeCompare(b.name));

  return { ok: true, profiles: included.map(entry => entry.profile), games, excluded };
}
