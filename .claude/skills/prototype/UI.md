# UI Prototype

Use this branch when the open question is visual or interaction design: page
layout, information hierarchy, primary affordance, density, or flow feel.

If the question is about logic or state transitions, use [LOGIC.md](LOGIC.md).

## Shape

Mount variants inside an existing page whenever one exists. Real header,
navigation, auth, data, and density make the prototype easier to judge.

- **Existing page:** keep route, data fetching, params, and auth. Swap only the
  rendered subtree based on `?variant=`. Use this unless there is no sensible
  host page.
- **Throwaway page:** create a clearly named prototype route only when there is
  no sensible host page.

Default to three variants. Cap at five.

## Process

1. State the question and variant count in a top-of-file comment:
   "Three variants of `<page>`, switchable via `?variant=`, on `<route>`."
2. Draft structurally different variants. They should disagree about layout,
   hierarchy, or primary action, not just color or copy.
3. Use the project's existing component library and styling system.
4. Wire variants through the framework router:

```tsx
const variant = searchParams.get("variant") ?? "A";

return (
  <>
    {variant === "A" && <VariantA {...data} />}
    {variant === "B" && <VariantB {...data} />}
    {variant === "C" && <VariantC {...data} />}
    <PrototypeSwitcher variants={["A", "B", "C"]} current={variant} />
  </>
);
```

5. Build one shared floating switcher component:
   - Bottom-center fixed bar.
   - Previous and next arrows with wraparound.
   - Current label such as `B - Sidebar layout`.
   - URL search param updates through the framework router.
   - Left/right keyboard cycling.
   - Do not intercept arrow keys while an input, textarea, or contenteditable
     element is focused.
   - Hide in production builds.
6. Add one run command through the existing task runner.
7. Capture the answer in `brain/prototypes/<slug>.md`.

## Red Flags

| Thought | Reality |
|---------|---------|
| "Three UI variants can share one layout with different colors." | UI variants must disagree structurally, not cosmetically. |

## Anti-Patterns

- Do not make variants that only differ in color, copy, or spacing.
- Do not share a layout abstraction across all variants.
- Do not wire prototype controls to real production mutations.
- Do not promote the prototype directly to production. Rebuild or absorb the
  winning direction through `implement`.
