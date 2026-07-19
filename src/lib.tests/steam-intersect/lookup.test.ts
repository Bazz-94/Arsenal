import { describe, expect, it, vi } from "vitest";
import { lookupFriends } from "../../lib/steam-intersect/lookupFriends";
import { SteamApiError, type SteamProfile } from "../../lib/shared/steam/types";
import type { SteamApiClient } from "../../lib/shared/steam/client";

/** Builds a `SteamProfile` with sensible defaults. */
function friend(steamId: string, overrides: Partial<SteamProfile> = {}): SteamProfile {
  return {
    steamId,
    name: `player-${steamId}`,
    avatarUrl: `https://avatars.example/${steamId}.jpg`,
    isPrivate: false,
    isUser: false,
    ...overrides,
  };
}

/** SteamID64 used as the resolved user in most tests. */
const SELF_ID = "76561197960287930";

/** Builds a mock `SteamApiClient` with overridable methods. */
function mockClient(overrides: Partial<SteamApiClient> = {}): SteamApiClient {
  return {
    resolveVanityUrl: vi.fn(async () => SELF_ID),
    getFriendIds: vi.fn(async () => ["111", "222"]),
    getPlayerSummaries: vi.fn(async (ids: string[]) => ids.map(id => friend(id))),
    ...overrides,
  } as SteamApiClient;
}

describe("lookupFriends", () => {
  it("returns invalid-input for unparseable input", async () => {
    const client = mockClient();
    await expect(lookupFriends(client, "not a valid id!!")).resolves.toEqual({
      ok: false,
      error: "invalid-input",
    });
    expect(client.resolveVanityUrl).not.toHaveBeenCalled();
  });

  it("resolves a vanity name before fetching friends", async () => {
    const client = mockClient();
    const result = await lookupFriends(client, "gabelogannewell");
    expect(client.resolveVanityUrl).toHaveBeenCalledWith("gabelogannewell");
    expect(result.ok).toBe(true);
  });

  it("skips vanity resolution for a SteamID64", async () => {
    const client = mockClient();
    await lookupFriends(client, SELF_ID);
    expect(client.resolveVanityUrl).not.toHaveBeenCalled();
    expect(client.getFriendIds).toHaveBeenCalledWith(SELF_ID);
  });

  it("returns not-found when the vanity name has no match", async () => {
    const client = mockClient({
      resolveVanityUrl: vi.fn(async () => null),
    });
    await expect(lookupFriends(client, "nobody")).resolves.toEqual({
      ok: false,
      error: "not-found",
    });
  });

  it("returns self and friends separately on success", async () => {
    const client = mockClient();
    const result = await lookupFriends(client, SELF_ID);
    expect(result).toEqual({
      ok: true,
      self: friend(SELF_ID, { isUser: true }),
      friends: [friend("111"), friend("222")],
    });
  });

  it("returns not-found when Steam has no summary for the id", async () => {
    const client = mockClient({
      getPlayerSummaries: vi.fn(async () => []),
    });
    await expect(lookupFriends(client, SELF_ID)).resolves.toEqual({
      ok: false,
      error: "not-found",
    });
  });

  it("maps a private friend list to a private-list error", async () => {
    const client = mockClient({
      getFriendIds: vi.fn(async () => {
        throw new SteamApiError("private-list", "private");
      }),
    });
    await expect(lookupFriends(client, SELF_ID)).resolves.toEqual({
      ok: false,
      error: "private-list",
    });
  });

  it("maps Steam API failures to an api-failure error", async () => {
    const client = mockClient({
      getFriendIds: vi.fn(async () => {
        throw new SteamApiError("api-failure", "boom");
      }),
    });
    await expect(lookupFriends(client, SELF_ID)).resolves.toEqual({
      ok: false,
      error: "api-failure",
    });
  });

  it("maps unexpected errors to api-failure", async () => {
    const client = mockClient({
      getFriendIds: vi.fn(async () => {
        throw new Error("network down");
      }),
    });
    await expect(lookupFriends(client, SELF_ID)).resolves.toEqual({
      ok: false,
      error: "api-failure",
    });
  });

  it("preserves privacy flags on friends", async () => {
    const client = mockClient({
      getPlayerSummaries: vi.fn(async (ids: string[]) =>
        ids.map(id => friend(id, { isPrivate: id === "222" }))
      ),
    });
    const result = await lookupFriends(client, SELF_ID);
    if (!result.ok) throw new Error("expected success");
    expect(result.friends.find(f => f.steamId === "222")?.isPrivate).toBe(true);
    expect(result.friends.find(f => f.steamId === "111")?.isPrivate).toBe(false);
  });
});
