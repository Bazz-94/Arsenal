# Story: Intersect - Enter SteamID and Select Friends

- Status: not started
- Dependency: sa-01-home-page-tool-menu

## Description
A user visits the Intersect tool and enters their own Steam identity (vanity URL or SteamID64). The app resolves the identity, fetches their Steam friend list, and lets the user pick up to 10 people (including themselves) to include in the game intersection.

## Acceptance Criteria
- The user can enter their SteamID as a vanity URL or a numeric SteamID64.
- The app resolves the entered value to a valid SteamID64 before proceeding.
- If the SteamID can't be resolved (invalid input, not found), the user sees a clear error and can retry.
- On success, the app displays the user's Steam friend list (name + avatar per friend).
- The user can select up to 10 people from the list.
- The user cannot select more than 10 people; attempting to exceed the limit is prevented with feedback.
- The user can proceed to view results (sa-03) once at least 2 people are selected selected.

## Notes
- Steam identity resolution and friend list lookup happen server-side (Steam Web API key never exposed to client).
- Uses Steam Web API `ResolveVanityURL` (if needed), `GetFriendList`, and `GetPlayerSummaries` (batched, max 100 per call) for names + avatars.
- Server-side responses should be cached in-memory with a TTL to reduce repeated Steam API calls.
- Transport: Server Functions in a separate `'use server'` file (`src/app/steam-intersect/actions.ts`); no route handlers.
- Cache: generic TTL cache behind one interface in `src/lib/cache.ts` (Map-based now, swappable later). TTL 5 min for all Steam responses.
- Selection: the resolved user appears in the list like a friend (selectable/deselectable). Max 10 selected total, proceed enabled at >= 2 selected.
- Privacy: if the user's own friend list is private, show clear error + retry. Private friends (communityvisibilitystate != 3) are shown with a "private" badge and are not selectable.
- Handoff to sa-03: Proceed navigates to `/steam-intersect/results?ids=<comma-separated SteamID64s>`. Results page itself is sa-03.
- Testing: Vitest set up this story (`npm test`). Unit tests for cache TTL, SteamID64 validation/vanity detection, friend mapping + privacy flags. Steam API client mocked.
- Env: `STEAM_API_KEY` in `.env.local` (user supplies).

## Open Questions
- None (resolved: private friends are shown with a private indicator and cannot be selected; a private own-friend-list is a clear error with retry).
