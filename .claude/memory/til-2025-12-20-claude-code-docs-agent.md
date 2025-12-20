# TIL: Claude Code Documentation Agent Architecture

- **Documentation map pattern**: Claude Code uses a centralized docs map (`claude_code_docs_map.md`) that indexes all documentation pages with their headings - enabling LLM agents to efficiently navigate and find relevant docs without crawling
- **Built-in vs custom agents**: Built-in agents like `claude-code-guide` are defined in the system prompt with specific tool access, while custom agents use the same `.claude/agents/*.md` format but are user-configurable
- **Closed source reality**: The Claude Code CLI implementation is closed-source (distributed via NPM), so built-in agent definitions cannot be inspected directly - only their behavior and the documentation map they consume

## Context
User asked to see the exact source code of how the `claude-code-guide` agent finds documentation. Explored GitHub repo, official docs, and the documentation map structure to understand the architecture.
