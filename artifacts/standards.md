# Standards

## Project

Full-stack website, hosts multiple tools. Built with Next.js (App Router) and Tailwind CSS.

- **Wrapper**: Home page is wrapper for all tools. Every tool uses shared root `app/layout.tsx`.
- **Separate tools**: Tools don't reference each other. Each tool must add or remove without breaking wrapper site or other tools.
- **Shared files**: Code shared across tools goes in `lib/` (logic/utilities) or `components/` (UI) at project root. No duplicating per tool.
- **Abstraction**: Shared systems (e.g. caching) go through one common interface, so implementation can change without touching tools.
- **Styling**: Component styling pulls from shared design tokens/theme, not one-off hardcoded values, for consistent look across tools.

## Design Principles

- **Clean Architecture**: Dependencies point inward only, toward Domain layer. Business logic, orchestration, infrastructure stay separated.
- **Services**: Group logic into services to decouple parts of app.

## TS Standards
- Follow standard TypeScript best practices. (Placeholder — replace with specific rules once defined.)

## Nextjs Standards
- Don't use 'use server' and 'use client' in the same file. Declare server functions or client only components in separate files and import them to interact.