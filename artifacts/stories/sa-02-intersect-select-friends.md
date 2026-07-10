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
- Uses Steam Web API `ResolveVanityURL` (if needed) and `GetFriendList`.
- Server-side responses should be cached in-memory with a TTL to reduce repeated Steam API calls.

## Open Questions
- If the user's friend list is private then they may not appear on the users friends list or they will appear 
but we won't be able to retrieve their information. If the latter then we should display what we can and provide an indication that there profile is private and cant be used in the intersection.
