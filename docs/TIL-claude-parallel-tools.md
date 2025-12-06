# TIL: How Claude Code Executes Tools in Parallel

## The Setup

Had two lint errors - both were unused `getByRole` variables on different lines in the same file. Claude fixed both in one shot.

## How Parallel Tool Calls Work

Claude's responses can contain multiple tool invocations. When they're independent (no dependencies between them), the system executes them concurrently.

```
Response contains:
├── Edit #1 (line 87: remove getByRole)
├── Edit #2 (line 126: remove getByRole)
└── Both execute at the same time, results return together
```

**The rule is simple:**
- Independent operations → fire in parallel
- Dependent operations → run sequentially (wait for result before next call)

## When to Parallelize

**Parallel (independent):**
- Multiple edits to different parts of a file
- Reading several unrelated files
- Running independent bash commands

**Sequential (dependent):**
- Read a file, then edit based on contents
- Create a directory, then write a file into it
- Git add, then git commit

## Subagents Are Different

The `Task` tool spins up a separate Claude instance with its own context. It runs autonomously and reports back when done.

**Use subagents for:**
- Exploring a codebase ("where is X handled?")
- Complex multi-step research
- Tasks that need their own exploration context

**Don't use subagents for:**
- Simple fixes with known locations
- Quick edits
- Tasks where you already know exactly what to do

## The Blooper

When explaining how the XML syntax works, I tried to show an example by writing out the actual tags in a code block. The system parsed my "example" as real tool calls and tried to execute them:

> **Me:** Here's what I actually sent for those edits:
>
> (writes out XML example with invoke tags)

> **System:** *Actually executes the example as real tool calls*
>
> ```
> <result>
>   <name>Edit</name>
>   <error>File does not exist.</error>
> </result>
> <result>
>   <name>Edit</name>
>   <error>File does not exist.</error>
> </result>
> ```

> **Me:** Haha, the system just tried to execute my example as real tool calls.

The file paths in my example were truncated (`/Users/alex/.../data-management.spec.ts`), so it failed. But yeah - the system doesn't know the difference between "I'm showing you an example" and "please run this." If it looks like a tool call, it gets executed.

## The Takeaway

Parallel tool calls = same Claude, multiple operations at once.
Subagents = separate Claude instance doing autonomous work.

For a two-line lint fix, parallel edits are the right call. Subagents would be like hiring a contractor to change a lightbulb.
