# Logic Prototype

Use this branch when the open question is about business logic, state
transitions, data shape, API feel, or edge cases that need to be driven by hand.

If the question is "what should this look like", use [UI.md](UI.md).

## Process

1. State the question in a top-of-file comment or nearby README:
   "This prototype checks whether `<state model>` handles `<scenario>`."
2. Use the host project's language and task runner. Do not introduce a new
   package manager or runtime.
3. Put the logic behind a small portable interface that can be lifted into real
   code later:
   - A reducer for discrete actions.
   - A state machine when legal transitions matter.
   - Pure functions over plain data when there is no current state.
   - A tiny class/module only when internal state is genuinely part of the
     question.
4. Keep the TUI as a thin shell over that interface. No terminal I/O,
   `console.log`, prompts, or ANSI codes inside the logic module.
5. Render one stable terminal frame:
   - Clear the screen each tick.
   - Show current state first, pretty-printed and diff-friendly.
   - Show keyboard shortcuts at the bottom.
   - Re-render after every action.
6. Add one run command through the existing task runner. If no runner exists,
   put the command at the top of the prototype README.
7. Capture the answer in `brain/prototypes/<slug>.md`.

## TUI Behavior

- Initialize one in-memory state object.
- Read one keystroke or line at a time.
- Dispatch to the pure module.
- Re-render the full frame after every action.
- Loop until quit.

The whole frame should fit on one screen.

## Red Flags

| Thought | Reality |
|---------|---------|
| "The TUI can contain the state logic." | The terminal shell is disposable; keep the logic portable. |

## Anti-Patterns

- Do not add tests.
- Do not wire to the real database unless persistence is the question.
- Do not generalize for later.
- Do not mix terminal code into the reducer, machine, or pure functions.
- Do not ship the TUI shell.
