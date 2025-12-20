# TIL: Composable Slash Commands

- **Composable slash commands**: Slash commands can delegate to other commands by simply instructing to execute them (e.g., `/ship` just says "Execute `/push` then `/pr`") - no duplication needed
- **Minimal command design**: A slash command can be as short as 7 lines if it orchestrates existing commands rather than reimplementing their logic

## Context
Created a `/ship` command that combines `/push` and `/pr`. Initial approach duplicated all the logic from both commands, but refactored to a thin wrapper that just delegates to the existing commands.
