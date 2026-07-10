# Write Stories

Convert feature requirements into stories and save them as markdown files.

## What it does

Takes a feature description and breaks it down into independently testable stories. Each story describes what needs to happen, not how to build it.

## How to use

Type `/write-stories` in the chat after providing feature context.

The skill will:
1. Summarize the feature based on context provided.
2. Ask for confirmation the summary is correct.
3. Break the feature into stories with acceptance criteria.
4. Ask for confirmation before writing.
5. Save each story as a markdown file in `artifacts/stories/`.

Stories are written in user language, never technical. Each story must be testable independently.
