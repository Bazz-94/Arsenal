---
name: create-implementation-plan
description: Creates an implementation plan for a given story.
---

Creates an implementation plan for a story: a list of tasks to complete the story.

## Process
1. If a story id was passed as an argument (e.g. `SA-008`), read the matching story file from `artifacts/stories/`. Otherwise ask the user which story to implement.
2. Read `artifacts/standards.md`.
3. Scan the codebase for relevant information.
4. Ask the user for implementation context: relevant information, constraints, requirements.
5. Run a grilling session (`/grilling` skill) to question the user about the story and its implementation.
6. Confirm with the user that all information is gathered and they are ready to plan.
7. Update the story with new information from the grilling session.
8. Create a plan of tasks to implement the story.
  - Tasks are small.
  - Task descriptions and acceptance criteria are terse.
  - Store the plan in `artifacts/implementation-plans/{storyid}.md`.
9. Ask the user to confirm the plan.

## Implementation Plan Format
``` md
# Plan for Implementing Story: {storyid}

Story: `artifacts/stories/{storyid}-{title}.md`

## Tasks
1. {task id}
  - Description: Short description of the task.
  - Acceptance Criteria: List of acceptance criteria.
  - Status: Not Started / In Progress / Completed

## Excludes
- Things outside the plan.
```
