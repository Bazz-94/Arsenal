import { describe, expect, it, vi } from "vitest";
import { getCommonGames } from "@/src/app/steam-intersect/_lib/getCommonGames";
import type { Profile } from "@/src/app/steam-intersect/_lib/types";
import type { SteamApiClient } from "@/src/app/_lib/steam/client";
import { SteamApiError, type SteamGame } from "@/src/app/_lib/steam/types";

/** Builds a `Profile` with sensible defaults. */
function profile(steamId: string, overrides: Partial<Profile> = {}): Profile {
  return {
    steamId,
    name: `player-${steamId}`,
    avatarUrl: `https://avatars.example/${steamId}.jpg`,
    isPrivate: false,
    personaState: 1,
    lastLogoff: 1_700_000_000,
    isUser: false,
    ...overrides,
  };
}

/** Builds a `SteamGame` with sensible defaults. */
function game(appid: number, overrides: Partial<SteamGame> = {}): SteamGame {
  return {
    appid,
    name: `Game ${appid}`,
    iconUrl: `https://icons.example/${appid}.jpg`,
    ...overrides,
  };
}

/** Builds a mock `SteamApiClient` with overridable methods. */
function mockClient(overrides: Partial<SteamApiClient> = {}): SteamApiClient {
  return {
    getPlayerSummaries: vi.fn(async (ids: string[]) => ids.map(id => profile(id))),
    getOwnedGames: vi.fn(async () => []),
    ...overrides,
  } as SteamApiClient;
}

describe("getCommonGames", () => {
  it("computes the intersection across profiles, sorted alphabetically", async () => {
    const client = mockClient({
      getOwnedGames: vi.fn(async (steamId: string) => {
        if (steamId === "1") {
          return [game(30, { name: "Zeta" }), game(10, { name: "Alpha" }), game(20, { name: "Beta" })];
        }
        return [game(10, { name: "Alpha" }), game(20, { name: "Beta" })];
      }),
    });
    const result = await getCommonGames(client, ["1", "2"]);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected success");
    expect(result.games.map(g => g.name)).toEqual(["Alpha", "Beta"]);
    expect(result.excluded).toEqual([]);
  });

  it("excludes a private profile with reason 'private'", async () => {
    const client = mockClient({
      getPlayerSummaries: vi.fn(async (ids: string[]) =>
        ids.map(id => profile(id, { isPrivate: id === "2" }))
      ),
      getOwnedGames: vi.fn(async (steamId: string) =>
        steamId === "2" ? null : [game(10)]
      ),
    });
    const result = await getCommonGames(client, ["1", "2"]);
    expect(result.excluded).toEqual([{ label: "player-2", reason: "private" }]);
  });

  it("excludes a public profile with a private game library as 'unavailable'", async () => {
    const client = mockClient({
      getOwnedGames: vi.fn(async (steamId: string) =>
        steamId === "2" ? null : [game(10)]
      ),
    });
    const result = await getCommonGames(client, ["1", "2"]);
    expect(result.excluded).toEqual([{ label: "player-2", reason: "unavailable" }]);
  });

  it("excludes an id with no profile summary, labeled by raw SteamID64", async () => {
    const client = mockClient({
      getPlayerSummaries: vi.fn(async () => [profile("1")]),
    });
    const result = await getCommonGames(client, ["1", "999"]);
    expect(result.excluded).toEqual([{ label: "999", reason: "unavailable" }]);
  });

  it("returns ok: false when every id ends up excluded", async () => {
    const client = mockClient({
      getPlayerSummaries: vi.fn(async () => []),
    });
    const result = await getCommonGames(client, ["1", "2"]);
    expect(result.ok).toBe(false);
    expect(result.excluded).toEqual([
      { label: "1", reason: "unavailable" },
      { label: "2", reason: "unavailable" },
    ]);
  });

  it("returns ok: false when getPlayerSummaries fails outright", async () => {
    const client = mockClient({
      getPlayerSummaries: vi.fn(async () => {
        throw new SteamApiError("api-failure", "boom");
      }),
    });
    const result = await getCommonGames(client, ["1", "2"]);
    expect(result.ok).toBe(false);
    expect(result.excluded).toEqual([
      { label: "1", reason: "unavailable" },
      { label: "2", reason: "unavailable" },
    ]);
  });

  it("excludes a profile whose getOwnedGames call fails, without aborting the rest", async () => {
    const client = mockClient({
      getOwnedGames: vi.fn(async (steamId: string) => {
        if (steamId === "2") throw new SteamApiError("api-failure", "boom");
        return [game(10)];
      }),
    });
    const result = await getCommonGames(client, ["1", "2"]);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected success");
    expect(result.excluded).toEqual([{ label: "player-2", reason: "unavailable" }]);
  });

  it("returns an empty games list (not ok: false) when profiles share nothing", async () => {
    const client = mockClient({
      getOwnedGames: vi.fn(async (steamId: string) =>
        steamId === "1" ? [game(10)] : [game(20)]
      ),
    });
    const result = await getCommonGames(client, ["1", "2"]);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected success");
    expect(result.games).toEqual([]);
  });
});
