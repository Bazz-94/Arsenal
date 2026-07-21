"use server";

import { getSteamClient } from "@/src/app/_lib/steam/server";
import { lookupProfiles, type LookupProfilesResult } from "@/src/app/steam-intersect/_lib/lookupProfiles";
import { getCommonGames, type CommonGamesResult } from "@/src/app/steam-intersect/_lib/getCommonGames";

/**
 * Server Function: resolves the entered Steam identity (vanity name,
 * SteamID64, or profile URL) and returns the user plus their friend list,
 * or a typed error. Read-only against the Steam Web API — safe to expose;
 * the API key stays server-side.
 *
 * @param input Raw identity text the user entered.
 */
export async function lookupSteamProfiles(
  input: string
): Promise<LookupProfilesResult> {
  return lookupProfiles(getSteamClient(), input);
}

/**
 * Server Function: recomputes the common-games intersection for the given
 * SteamID64s. Used by the results page to update the list as the user
 * toggles profiles in or out.
 *
 * @param steamIds SteamID64s currently selected.
 */
export async function recomputeCommonGames(
  steamIds: string[]
): Promise<CommonGamesResult> {
  return getCommonGames(getSteamClient(), steamIds);
}
