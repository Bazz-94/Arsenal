# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint with ESLint (flat config, `eslint.config.mjs`)
- `npm test` — run the vitest suite once (`vitest run`)
- `npx vitest run <path>` — run a single test file
- `npx tsc --noEmit` — typecheck

Requires `STEAM_API_KEY` in `.env.local` for the Steam Intersect tool to work locally (see `src/app/_lib/steam/server.ts`).

## Architecture

Next.js App Router, TypeScript, Tailwind CSS v4 (`@tailwindcss/postcss`, no `tailwind.config`). All app code lives under `src/`; path alias `@/*` resolves to the project root.

This is a multi-tool site (see `artifacts/standards.md` for the full rules), currently hosting one tool, Steam Intersect. Key rules from that doc that shape how code is organized:

- **Tools are independent**: each tool lives under `src/app/<tool>/` and must not reference another tool. Code shared across tools goes in `src/app/_lib/` or `src/app/_components/` (App Router private folders — the underscore prefix excludes them from routing).
- **Tool-local logic and components** live in the tool's own `_lib/` and `_components/` private folders, e.g. `src/app/steam-intersect/_lib/`, `src/app/steam-intersect/_components/`.
- **`"use server"` / `"use client"` never share a file**: Server Functions live in a dedicated file (e.g. `src/app/steam-intersect/_lib/actions.ts`) and are imported into client components, rather than mixing directives in one file.
- **Shared infrastructure goes through an interface** so implementations can change later — e.g. `Cache` (`src/app/_lib/cache.ts`, currently `InMemoryCache`) is what `SteamApiClient` depends on, not a concrete store.
- **Zustand for client state**, one store per tool, colocated with it (e.g. `src/app/steam-intersect/store.ts`), combining state and actions in a single `create()` call.
- **JSDoc on every function and every type/interface/class member.**

There is also a legacy Pages Router route, `src/pages/api/test.ts`, coexisting with the App Router — a connectivity-check endpoint for external apps, not part of any tool.

### Steam Intersect tool (`src/app/steam-intersect/`, `src/app/_lib/steam/`)

Layering, from the API outward:

- `src/app/_lib/steam/client.ts` — `SteamApiClient`: thin wrapper over the Steam Web API (`ResolveVanityURL`, `GetFriendList`, `GetPlayerSummaries`, `GetOwnedGames`). All responses cached for 5 min via the injected `Cache`; failures normalize to `SteamApiError` with a machine-readable `SteamErrorCode`.
- `src/app/_lib/steam/server.ts` — `getSteamClient()`, a `server-only` lazy singleton holding the API key and cache, shared across requests.
- `src/app/_lib/steam/identity.ts` — parses user input (vanity name, SteamID64, or profile URL) into a typed identity.
- `src/app/steam-intersect/_lib/lookupProfiles.ts` / `getCommonGames.ts` — tool-specific orchestration over `SteamApiClient`, returning discriminated-union results (`{ ok: true, ... } | { ok: false, error }`) rather than throwing, so callers/UI branch on `error` codes.
- `src/app/steam-intersect/_lib/actions.ts` — the `"use server"` boundary; thin pass-throughs to the above that client components call directly (React Server Functions, not a REST API).
- `src/app/steam-intersect/store.ts` — Zustand store driving the selection step (identity input, resolved profiles, selection set, filter).
- `src/app/steam-intersect/_components/` and `results/` — client components consuming the store and calling the Server Functions.

When adding a new tool, mirror this shape: `src/app/<tool>/_lib/` for pure logic (unit-tested), `src/app/<tool>/_components/` for components, `src/app/<tool>/store.ts` for state, and put anything reusable across tools in `src/app/_lib/` or `src/app/_components/`.

## Testing

- Vitest only; tests live in dot-named sibling directories mirroring the source tree, not colocated — e.g. `src/app.tests/steam-intersect/_lib/getCommonGames.test.ts` tests `src/app/steam-intersect/_lib/getCommonGames.ts`. `vitest.config.ts` includes `src/**/*.tests/**/*.test.ts`.
- Per `artifacts/standards.md`, only backend/logic code is unit tested (`_lib/`); UI is verified via build/lint/manual checking, not component tests.

## Planning artifacts

`artifacts/stories/` holds planning stories (status, dependencies, acceptance criteria) — check a story's `Status` field before assuming a feature is or isn't built, but don't fully trust it either; verify against the actual code, since stories can go stale after implementation.

## Important: non-standard Next.js version

`package.json` pins `next@16.2.10`, a version ahead of this model's training data — APIs and conventions may differ from what you expect. Before writing Next.js code, check the bundled docs in `node_modules/next/dist/docs/` (organized into `01-app`, `02-pages`, `03-architecture`, `04-community`) rather than relying on prior knowledge, and heed any deprecation notices found there.
