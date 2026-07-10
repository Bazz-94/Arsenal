# Story: Home Page Tool Menu

- Status: not started
- Dependency: None

## Description
The home page acts as a menu for the tools hosted on Arsenal. Visitors land on the home page and see a list of available tools, each linking to its own page. For now, only one tool (Intersect) is listed.

## Acceptance Criteria
- The home page displays a list of available tools.
- Each listed tool shows a name and short description.
- Clicking/tapping a tool entry navigates to that tool's page.
- Only "Intersect" is listed as an available tool for now.
- The tool list is defined as a static list in code (no database, no admin UI).
- The page is usable on both desktop and mobile widths.

## Notes
- Tool list shape: `{ name, description, path }`.
- Adding future tools should just mean adding another entry to the static list.

## Open Questions
- None
