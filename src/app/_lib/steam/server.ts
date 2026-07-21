import "server-only";
import { InMemoryCache } from "../cache";
import { SteamApiClient } from "./client";

/** Lazily created singleton shared across requests. */
let client: SteamApiClient | null = null;

/**
 * Returns the process-wide `SteamApiClient`, creating it on first use so
 * the 5-min cache is shared across requests.
 *
 * @throws Error when `STEAM_API_KEY` is not set.
 */
export function getSteamClient(): SteamApiClient {
  if (!client) {
    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) {
      throw new Error("STEAM_API_KEY is not set (add it to .env.local)");
    }
    client = new SteamApiClient({ apiKey, cache: new InMemoryCache() });
  }
  return client;
}
