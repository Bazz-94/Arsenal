---
name: write-stories
description: Write stories based on the user's input.
---

Writes stories from feature context provided by the user.

## Instructions
1. Summarize the task or feature from the chat context.
2. Ask the user to confirm the summary is correct.
3. Break the task into stories.
  - Stories describe what the user wants, not how it is implemented or technical design.
  - Each story is a vertical slice: implementable and testable independently.
  - Max 8 acceptance criteria per story.
  - Sort stories in a logical order with dependencies between stories clearly indicated.
4. Summarize the story breakdown and ask the user to confirm before writing files.
5. Write each story to a separate markdown file in `/artifacts/stories/` using the template below. Use a unique storyid, e.g. `sa-01-title`.

## Story Breakdown Format
1. Story Id - Short Description
2. Story Id - Short Description

## Story Template
 `/artifacts/stories/{sa-01-title}.md`
``` md
# Story: Reset Forgotten Password

- Status: not started | in progress | completed
- Dependency: sa-00-title

## Description
Users can reset their password if they forget it.
Etc ...

## Acceptance Criteria
- The user can request a password reset from the login page.
- Etc ...

## Notes
- Password requirements match the existing account security rules.
- Etc ...

## Open Questions
- Send a confirmation email after the password is reset?
```