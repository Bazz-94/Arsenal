"use server";

import { getSteamClient } from "@/src/lib/shared/steam/server";
import { lookupProfiles, type LookupProfilesResult } from "@/src/lib/steam-intersect/lookupProfiles";

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
