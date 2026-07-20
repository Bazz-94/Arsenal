# Story: Intersect - View Common Games

- Status: not started
- Dependency: sa-02-intersect-select-friends

## Description
After selecting friends, the user sees the list of games owned in common by themself and all selected friends, so they can decide what to play together.

## Acceptance Criteria
- The app fetches the owned-games library for the user and each selected friend.
- The app computes the intersection of games owned by all the selected people, matched by game (Steam appid).
- The result list shows each common game's name and icon, sorted alphabetically by name.
- If no games are common to everyone selected, the user sees a clear "no common games" message.
- If a selected profile's game library can't be read (private profile, private game-library setting, or the account no longer resolves), that profile is excluded from the intersection and the user sees a clear message naming which profile(s) were excluded and why, rather than the whole request failing.
- If every selected profile (including the user) ends up excluded, the user sees a clear overall error.
- Navigating to the results view without a valid selection (missing/empty, or fewer than the minimum required people) shows a simple message instead of attempting a lookup.
- Owned-games lookups are cached server-side in-memory with a TTL to reduce repeated Steam API calls.

## Notes
- Uses Steam Web API `GetOwnedGames` (`include_appinfo=true` for name/icon via `img_icon_url`), and `GetPlayerSummaries` to re-resolve names/avatars/privacy for the selected ids (already cached from the selection step in the common case).
- Steam Web API key stays server-side only; all Steam calls happen through server/API routes.
- Result display is name + icon only (no playtime). Games with no icon hash show a placeholder instead of a broken image.
- Results page is `steam-intersect/results` (Server Component), already routed to from sa-02 with `?ids=`.
- `GetOwnedGames` has no explicit "private" error — Steam returns 200 with no games field for both a private profile and a public profile with a private game-library setting. Treated as one "unavailable" case, not a thrown error.
- An id `GetPlayerSummaries` returns nothing for (deleted/banned account) is excluded the same way, labeled by raw SteamID64 since no profile name exists for it.
- Reuses the existing Steam in-memory TTL cache pattern (`STEAM_CACHE_TTL_MS`).
