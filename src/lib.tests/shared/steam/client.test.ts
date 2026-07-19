import { describe, expect, it, vi } from "vitest";
import { InMemoryCache } from "../../../lib/cache";
import {
  PLAYER_SUMMARIES_BATCH_SIZE,
  SteamApiClient,
  mapPlayerToProfile,
} from "../../../lib/shared/steam/client";
import { SteamApiError } from "../../../lib/shared/steam/types";

/** Builds a JSON `Response` with the given body and status. */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Creates a client with a fresh cache and the given mocked fetch. */
function makeClient(fetchFn: typeof fetch) {
  return new SteamApiClient({
    apiKey: "test-key",
    cache: new InMemoryCache(),
    fetchFn,
  });
}

/** Builds a raw Steam player summary object; public profile by default. */
function playerSummary(id: string, overrides: Record<string, unknown> = {}) {
  return {
    steamid: id,
    personaname: `player-${id}`,
    avatarfull: `https://avatars.example/${id}.jpg`,
    communityvisibilitystate: 3,
    ...overrides,
  };
}

describe("mapPlayerToProfile", () => {
  it("maps a public player summary", () => {
    expect(mapPlayerToProfile(playerSummary("1"))).toEqual({
      steamId: "1",
      name: "player-1",
      avatarUrl: "https://avatars.example/1.jpg",
      isPrivate: false,
      isUser: false,
    });
  });

  it("flags non-public visibility states as private", () => {
    expect(
      mapPlayerToProfile(playerSummary("1", { communityvisibilitystate: 1 }))
        .isPrivate
    ).toBe(true);
    expect(
      mapPlayerToProfile(playerSummary("1", { communityvisibilitystate: 2 }))
        .isPrivate
    ).toBe(true);
  });
});

describe("SteamApiClient.resolveVanityUrl", () => {
  it("returns the SteamID64 on success and sends the key", async () => {
    const fetchFn = vi.fn(async (url: RequestInfo | URL) => {
      expect(String(url)).toContain("ResolveVanityURL");
      expect(String(url)).toContain("key=test-key");
      expect(String(url)).toContain("vanityurl=gabe");
      return jsonResponse({
        response: { success: 1, steamid: "76561197960287930" },
      });
    });
    const client = makeClient(fetchFn as typeof fetch);
    await expect(client.resolveVanityUrl("gabe")).resolves.toBe(
      "76561197960287930"
    );
  });

  it("returns null when the vanity name has no match", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ response: { success: 42, message: "No match" } })
    );
    const client = makeClient(fetchFn as typeof fetch);
    await expect(client.resolveVanityUrl("nobody")).resolves.toBeNull();
  });

  it("caches successful resolutions", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ response: { success: 1, steamid: "76561197960287930" } })
    );
    const client = makeClient(fetchFn as typeof fetch);
    await client.resolveVanityUrl("gabe");
    await client.resolveVanityUrl("gabe");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("throws api-failure on a non-OK response", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({}, 500));
    const client = makeClient(fetchFn as typeof fetch);
    await expect(client.resolveVanityUrl("gabe")).rejects.toMatchObject({
      name: "SteamApiError",
      code: "api-failure",
    });
  });
});

describe("SteamApiClient.getFriendIds", () => {
  it("returns friend SteamID64s", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({
        friendslist: {
          friends: [
            { steamid: "111", relationship: "friend", friend_since: 0 },
            { steamid: "222", relationship: "friend", friend_since: 0 },
          ],
        },
      })
    );
    const client = makeClient(fetchFn as typeof fetch);
    await expect(client.getFriendIds("76561197960287930")).resolves.toEqual([
      "111",
      "222",
    ]);
  });

  it("throws private-list on a 401 response", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({}, 401));
    const client = makeClient(fetchFn as typeof fetch);
    const error = await client.getFriendIds("76561197960287930").catch(e => e);
    expect(error).toBeInstanceOf(SteamApiError);
    expect(error.code).toBe("private-list");
  });

  it("does not cache the friend list", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ friendslist: { friends: [] } })
    );
    const client = makeClient(fetchFn as typeof fetch);
    await client.getFriendIds("76561197960287930");
    await client.getFriendIds("76561197960287930");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});

describe("SteamApiClient.getPlayerSummaries", () => {
  it("maps players and preserves the requested order", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({
        response: { players: [playerSummary("222"), playerSummary("111")] },
      })
    );
    const client = makeClient(fetchFn as typeof fetch);
    const friends = await client.getPlayerSummaries(["111", "222"]);
    expect(friends.map(f => f.steamId)).toEqual(["111", "222"]);
  });

  it("returns an empty array for no ids without calling the API", async () => {
    const fetchFn = vi.fn();
    const client = makeClient(fetchFn as unknown as typeof fetch);
    await expect(client.getPlayerSummaries([])).resolves.toEqual([]);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("splits requests into batches of 100 ids", async () => {
    const ids = Array.from({ length: 150 }, (_, i) => String(i + 1));
    const fetchFn = vi.fn(async (url: RequestInfo | URL) => {
      const requested = new URL(String(url)).searchParams
        .get("steamids")!
        .split(",");
      expect(requested.length).toBeLessThanOrEqual(
        PLAYER_SUMMARIES_BATCH_SIZE
      );
      return jsonResponse({
        response: { players: requested.map(id => playerSummary(id)) },
      });
    });
    const client = makeClient(fetchFn as typeof fetch);
    const friends = await client.getPlayerSummaries(ids);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(friends).toHaveLength(150);
    expect(friends.map(f => f.steamId)).toEqual(ids);
  });

  it("omits ids Steam did not return", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ response: { players: [playerSummary("111")] } })
    );
    const client = makeClient(fetchFn as typeof fetch);
    const friends = await client.getPlayerSummaries(["111", "999"]);
    expect(friends.map(f => f.steamId)).toEqual(["111"]);
  });

  it("caches summaries per batch", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ response: { players: [playerSummary("111")] } })
    );
    const client = makeClient(fetchFn as typeof fetch);
    await client.getPlayerSummaries(["111"]);
    await client.getPlayerSummaries(["111"]);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
