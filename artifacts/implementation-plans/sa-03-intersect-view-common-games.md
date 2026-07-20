# Plan for Implementing Story: sa-03-intersect-view-common-games

Story: `artifacts/stories/sa-03-intersect-view-common-games.md`

## Tasks
1. game-type
  - Description: Add `Game` type (appid, name, icon URL or null) in `src/lib/steam-intersect/types.ts`.
  - Acceptance Criteria:
    - `Game` has `appid: number`, `name: string`, `iconUrl: string | null`.
    - JSDoc on the type and every property, per standards.
  - Status: Not Started

2. client-get-owned-games
  - Description: Add `getOwnedGames(steamId): Promise<Game[] | null>` to `SteamApiClient` (`src/lib/shared/steam/client.ts`), calling `GetOwnedGames` with `include_appinfo=true`, with unit tests in `src/lib.tests/shared/steam/client.test.ts`.
  - Acceptance Criteria:
    - Returns `null` when the response has no games field (private profile or private game-library setting) — does not throw for this case.
    - Maps each returned game to `Game`; builds `iconUrl` from `appid` + `img_icon_url`, or `null` when `img_icon_url` is empty.
    - Response cached under a per-`steamId` key with `STEAM_CACHE_TTL_MS`, mirroring `getPlayerSummariesBatch`.
    - Throws `SteamApiError("api-failure", ...)` on network error or non-OK HTTP status, same as other client methods.
    - Tests cover: normal mapping, `null` on no-games response, `iconUrl` built correctly (incl. `null` for empty `img_icon_url`), caching by steamId, `api-failure` on non-OK status.
  - Status: Not Started

3. get-common-games-service
  - Description: Add `getCommonGames(client, steamIds): Promise<CommonGamesResult>` in `src/lib/steam-intersect/getCommonGames.ts`, with unit tests in `src/lib.tests/steam-intersect/getCommonGames.test.ts` using a mocked `SteamApiClient`.
  - Acceptance Criteria:
    - Re-fetches profiles via `client.getPlayerSummaries(steamIds)`.
    - Any id with no returned profile is excluded, reason `"unavailable"`, labeled by raw SteamID64.
    - For each resolved profile, fetches owned games in parallel via `getOwnedGames`; `null` result excludes that profile with reason `"private"` (private profile) or `"unavailable"` (public profile, private game-library setting) — distinguish using the profile's `isPrivate` flag.
    - Result shape: `{ ok: true, games: Game[] (intersection by appid, sorted alphabetically by name), excluded: { label: string, reason: "private" | "unavailable" }[] }` on partial/full success, or `{ ok: false }` when every id is excluded.
    - JSDoc per standards.
    - Tests cover: correct intersection across 2+ profiles, exclusion with correct reason for a profile with no owned-games result, exclusion of an id with no profile summary (labeled by raw SteamID64), `ok: false` when all ids excluded, empty (not `ok: false`) `games` when profiles resolve but share nothing, alphabetical sort of common games.
  - Status: Not Started

4. results-page
  - Description: Add `src/app/steam-intersect/results/page.tsx` (Server Component), reading `ids` from `searchParams`.
  - Acceptance Criteria:
    - Missing/empty `ids`, or fewer than `MIN_SELECTED` ids, renders a simple message — no lookup attempted.
    - Otherwise calls `getCommonGames(getSteamClient(), ids)` and renders:
      - common games grid/list: icon (or placeholder tile when `iconUrl` is `null`) + name, sorted as returned.
      - "no common games" message when `games` is empty but the lookup succeeded.
      - excluded-profiles notice listing each excluded label + reason, when any.
      - overall error message when the result is `ok: false`.
    - No `"use client"` in this file (Server Component); no `"use server"` needed since nothing is user-triggered.
  - Status: Not Started

## Excludes
- Playtime or any stat beyond name + icon.
- Editing the selection from the results page (back-navigation to the selection step is out of scope here).
- Changing `IntersectTool`/`store.ts`/sa-02 behavior — this plan only adds the results view.
