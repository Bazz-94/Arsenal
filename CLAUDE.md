# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint with ESLint (flat config, `eslint.config.mjs`)

There is no test runner configured in this repo yet.

## Architecture

- Next.js App Router (`app/`), TypeScript, Tailwind CSS v4 (via `@tailwindcss/postcss`, no `tailwind.config`).
- `app/layout.tsx` — root layout; loads Geist Sans/Mono via `next/font/google` and sets global metadata.
- `app/page.tsx` — home page.
- Path alias `@/*` resolves to the project root (`tsconfig.json`).
- Per the README, this project is intended to become "a full stack website that hosts multiple tools" — currently just the scaffolded starter page.

## Planned work

`artifacts/stories/` contains planning stories (status, dependencies, acceptance criteria) for upcoming features — not yet implemented:
- `sa-01-home-page-tool-menu.md` — home page becomes a static menu of available tools
- `sa-02-intersect-select-friends.md` / `sa-03-intersect-view-common-games.md` — first tool, "Intersect": given a Steam profile, find games owned in common across the user and selected friends via the Steam Web API (server-side API key, in-memory TTL cache for Steam responses)

Check a story's `Status` field before assuming it's built.

## Important: non-standard Next.js version

`package.json` pins `next@16.2.10`, a version ahead of this model's training data — APIs and conventions may differ from what you expect. Before writing Next.js code, check the bundled docs in `node_modules/next/dist/docs/` (organized into `01-app`, `02-pages`, `03-architecture`, `04-community`) rather than relying on prior knowledge, and heed any deprecation notices found there.
