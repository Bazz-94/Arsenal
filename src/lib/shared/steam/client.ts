import type { Cache } from "../../cache";
import { SteamApiError, type SteamProfile } from "./types";

/** Root URL of the Steam Web API. */
const BASE_URL = "https://api.steampowered.com";

/** TTL applied to every cached Steam response (5 minutes). */
export const STEAM_CACHE_TTL_MS = 5 * 60 * 1000;
/** Max SteamIDs GetPlayerSummaries accepts per call. */
export const PLAYER_SUMMARIES_BATCH_SIZE = 100;

/** Subset of Steam's GetPlayerSummaries player object that we consume. */
type PlayerSummary = {
  /** The player's SteamID64. */
  steamid: string;
  /** Steam display name. */
  personaname: string;
  /** URL of the full-size (184x184) avatar. */
  avatarfull: string;
  /** Profile visibility: 3 = public, 1/2 = private or friends-only. */
  communityvisibilitystate: number;
};

/** Shape of the ResolveVanityURL v1 response body. */
type ResolveVanityResponse = {
  /** Result wrapper: `success` 1 = match found, 42 = no match. */
  response: {
    /** Steam status code: 1 on success. */
    success: number;
    /** Resolved SteamID64, present only when `success` is 1. */
    steamid?: string;
  };
};

/** Shape of the GetFriendList v1 response body. */
type FriendListResponse = {
  /** Wrapper object; absent when the list is empty. */
  friendslist?: {
    /** One entry per friend relationship. */
    friends: Array<{
      /** The friend's SteamID64. */
      steamid: string;
    }>;
  };
};

/** Shape of the GetPlayerSummaries v2 response body. */
type PlayerSummariesResponse = {
  /** Result wrapper. */
  response: {
    /** Summaries for the requested ids; unknown ids are omitted by Steam. */
    players: PlayerSummary[];
  };
};

/**
 * Maps a raw Steam player summary to the app's `SteamProfile` shape.
 * `communityvisibilitystate` 3 means public; anything else is flagged
 * private.
 */
export function mapPlayerToProfile(player: PlayerSummary): SteamProfile {
  return {
    steamId: player.steamid,
    name: player.personaname,
    avatarUrl: player.avatarfull,
    isPrivate: player.communityvisibilitystate !== 3,
    isUser: false,
  };
}

/** Splits `items` into consecutive arrays of at most `size` elements. */
function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Constructor dependencies for `SteamApiClient`. */
export type SteamApiClientOptions = {
  /** Steam Web API key, sent with every request. */
  apiKey: string;
  /** Cache used to hold Steam responses for `STEAM_CACHE_TTL_MS`. */
  cache: Cache;
  /** Fetch implementation; defaults to global `fetch`. Injected in tests. */
  fetchFn?: typeof fetch;
};

/**
 * Thin client over the Steam Web API endpoints this app needs. All
 * responses are cached for `STEAM_CACHE_TTL_MS`; failures are thrown as
 * `SteamApiError`.
 */
export class SteamApiClient {
  /** Steam Web API key, sent with every request. */
  private readonly apiKey: string;
  /** Cache holding Steam responses. */
  private readonly cache: Cache;
  /** Fetch implementation used for HTTP calls. */
  private readonly fetchFn: typeof fetch;

  /** @param options API key, cache, and optional fetch override. */
  constructor(options: SteamApiClientOptions) {
    this.apiKey = options.apiKey;
    this.cache = options.cache;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  /**
   * Resolves a vanity name to a SteamID64 via ResolveVanityURL.
   *
   * @param vanityName The custom profile name (case-insensitive).
   * @returns The SteamID64, or `null` if no profile matches.
   */
  async resolveVanityUrl(vanityName: string): Promise<string | null> {
    const cacheKey = `steam:vanity:${vanityName.toLowerCase()}`;
    const cached = this.cache.get<string>(cacheKey);
    if (cached !== undefined) return cached;

    const data = await this.request<ResolveVanityResponse>(
      "/ISteamUser/ResolveVanityURL/v1/",
      { vanityurl: vanityName }
    );
    if (data.response.success !== 1 || !data.response.steamid) return null;

    this.cache.set(cacheKey, data.response.steamid, STEAM_CACHE_TTL_MS);
    return data.response.steamid;
  }

  /**
   * Fetches the SteamID64s of a user's friends via GetFriendList.
   * Not cached so newly added friends appear on the next lookup.
   *
   * @param steamId The owner's SteamID64.
   * @returns Friend SteamID64s (empty when the user has no friends).
   * @throws SteamApiError `private-list` when the friend list is not
   * visible (Steam responds 401).
   */
  async getFriendIds(steamId: string): Promise<string[]> {
    const data = await this.request<FriendListResponse>(
      "/ISteamUser/GetFriendList/v1/",
      { steamid: steamId, relationship: "friend" },
      { privateStatus: 401 }
    );
    return (data.friendslist?.friends ?? []).map(f => f.steamid);
  }

  /**
   * Fetches name/avatar/privacy for the given ids via GetPlayerSummaries,
   * batching `PLAYER_SUMMARIES_BATCH_SIZE` ids per call.
   *
   * @param steamIds SteamID64s to look up.
   * @returns Profiles in the same order as `steamIds`; ids Steam does not
   * return (deleted accounts etc.) are omitted.
   */
  async getPlayerSummaries(steamIds: string[]): Promise<SteamProfile[]> {
    const bySteamId = new Map<string, SteamProfile>();

    for (const batch of chunk(steamIds, PLAYER_SUMMARIES_BATCH_SIZE)) {
      for (const profile of await this.getPlayerSummariesBatch(batch)) {
        bySteamId.set(profile.steamId, profile);
      }
    }

    return steamIds
      .map(id => bySteamId.get(id))
      .filter((profile): profile is SteamProfile => profile !== undefined);
  }

  /** Fetches and caches one GetPlayerSummaries batch (max 100 ids). */
  private async getPlayerSummariesBatch(
    steamIds: string[]
  ): Promise<SteamProfile[]> {
    const cacheKey = `steam:players:${steamIds.join(",")}`;
    const cached = this.cache.get<SteamProfile[]>(cacheKey);
    if (cached !== undefined) return cached;

    const data = await this.request<PlayerSummariesResponse>(
      "/ISteamUser/GetPlayerSummaries/v2/",
      { steamids: steamIds.join(",") }
    );
    const profiles = data.response.players.map(mapPlayerToProfile);

    this.cache.set(cacheKey, profiles, STEAM_CACHE_TTL_MS);
    return profiles;
  }

  /**
   * Performs a GET against the Steam Web API and parses the JSON body.
   *
   * @param path Endpoint path under `BASE_URL`.
   * @param params Query parameters (the API key is added automatically).
   * @param options `privateStatus`: HTTP status to translate into a
   * `private-list` error instead of `api-failure`.
   * @throws SteamApiError `api-failure` on network errors or non-OK
   * statuses; `private-list` when the status equals `privateStatus`.
   */
  private async request<T>(
    path: string,
    params: Record<string, string>,
    options: { privateStatus?: number } = {}
  ): Promise<T> {
    const url = new URL(path, BASE_URL);
    url.searchParams.set("key", this.apiKey);
    for (const [name, value] of Object.entries(params)) {
      url.searchParams.set(name, value);
    }

    let response: Response;
    try {
      response = await this.fetchFn(url);
    } catch (error) {
      throw new SteamApiError("api-failure", `Steam API request failed: ${error}`);
    }

    if (response.status === options.privateStatus) {
      throw new SteamApiError("private-list", "Steam friend list is private");
    }
    if (!response.ok) {
      throw new SteamApiError(
        "api-failure",
        `Steam API responded with status ${response.status}`
      );
    }
    return (await response.json()) as T;
  }
}
