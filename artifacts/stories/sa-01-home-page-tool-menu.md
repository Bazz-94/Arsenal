# Story: Home Page Tool Menu

- Status: completed
- Dependency: None

## Description
The home page acts as a menu for the tools hosted on Arsenal. Visitors land on the home page and see a list of available tools, each linking to its own page. For now, only one tool (Intersect) is listed.

## Acceptance Criteria
- The home page displays a list of available tools.
- Each listed tool shows a name and short description.
- Clicking/tapping a tool entry navigates to that tool's page.
- Only "Steam Intersect" is listed as an available tool for now (route `/steam-intersect`).
- The tool list is defined as a static list in code (no database, no admin UI).
- The page is usable on both desktop and mobile widths.

## Notes
- Tool list shape: `{ name, description, path }`.
- Adding future tools should just mean adding another entry to the static list.
- Layout: "Arsenal" title + tagline above a responsive card grid (1 col mobile, 2-3 cols desktop); whole card clickable via `next/link`.
- Tool list lives inline in `src/app/page.tsx` (not `lib/`).
- Stub page at `src/app/steam-intersect/page.tsx` ("coming soon") so navigation works until sa-02.
- Card styling via new `--card` / `--card-border` theme tokens in `globals.css` (light + dark).
- Update stale metadata in `src/app/layout.tsx` (title "Arsenal", real description).
- No unit tests for this story (frontend-only); verify via build + lint + manual run.

## Open Questions
- None
