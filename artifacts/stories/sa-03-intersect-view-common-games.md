# Story: Intersect - View Common Games

- Status: not started
- Dependency: sa-02-intersect-select-friends

## Description
After selecting friends, the user sees the list of games owned in common by themself and all selected friends, so they can decide what to play together.

## Acceptance Criteria
- The app fetches the owned-games library for the user and each selected friend.
- The app computes the intersection of games owned by the all the selected people.
- The result list shows each common game's name and icon.
- If no games are common to everyone selected, the user sees a clear "no common games" message.
- If a selected friend's game library is private or unavailable, that friend cannot be selected for the intersection and the user sees a clear message identifying which friend(s) can't be added and why, rather than the request failing outright.
- If every selected profile (including the user) fails to resolve, the user sees a clear overall error.
- Owned-games lookups are cached server-side in-memory with a TTL to reduce repeated Steam API calls.

## Notes
- Uses Steam Web API `GetOwnedGames` (and `GetPlayerSummaries` if needed for profile visibility/avatar data).
- Steam Web API key stays server-side only; all Steam calls happen through server/API routes.
- Result display is name + icon only (no playtime).

## Open Questions
- We should be able to find out about a profile being private from the retrieving their profile to show them on the list, before we need to retrieve their game library.
