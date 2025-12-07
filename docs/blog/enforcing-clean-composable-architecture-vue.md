# Enforcing Clean Composable Architecture in Vue

Vue 3's Composition API encourages extracting reusable logic into composables. But without guardrails, codebases accumulate "premature abstractions" — composables extracted too early that end up used only once.

This post shows how to enforce a simple rule: **shared composables must be used at least twice**.

## The Problem

When developers extract logic into a composable, they often do it preemptively:

```ts
// src/composables/useUserGreeting.ts
export function useUserGreeting(name: string) {
  return computed(() => `Hello, ${name}!`)
}
```

If this composable only gets used in one component, you've added indirection without gaining reusability. The logic would be clearer inline.

## The Rule

> Only extract a composable to a shared location when it's used in 2+ places.

This keeps single-use logic colocated with its component while encouraging genuine reuse.

## Why ESLint Can't Help

ESLint analyzes files in isolation. It can't count how many times an export gets imported across your codebase. Tools like [Knip](https://knip.dev) detect *unused* exports (0 usages), but not *under-used* ones (1 usage).

## The Solution: A Simple Shell Script

Create `scripts/check-composable-usage.sh`:

```bash
#!/bin/bash
# Check that all composables are used at least 2 times

THRESHOLD=2
HAS_VIOLATIONS=false

# Find all composable files
for file in $(find src/composables src/features/*/composables -name "*.ts" 2>/dev/null | grep -v "__tests__"); do
  # Extract composable name (e.g., useRestTimer)
  name=$(grep -oE 'export function (use[A-Za-z]+)' "$file" | head -1 | awk '{print $3}')

  if [ -n "$name" ]; then
    # Count imports across src/ (excluding the composable's own file and tests)
    count=$(grep -r "$name" src --include="*.vue" --include="*.ts" \
      | grep -v "__tests__" \
      | grep -v "$file" \
      | wc -l | tr -d ' ')

    if [ "$count" -lt "$THRESHOLD" ]; then
      echo "⚠️  $name ($file) - only $count usage(s), minimum is $THRESHOLD"
      HAS_VIOLATIONS=true
    fi
  fi
done

if [ "$HAS_VIOLATIONS" = true ]; then
  exit 1
fi

echo "✓ All composables are used at least $THRESHOLD times"
exit 0
```

Add it to your `package.json`:

```json
{
  "scripts": {
    "check:composables": "bash scripts/check-composable-usage.sh"
  }
}
```

## How It Works

1. **Finds all composable files** in shared and feature directories
2. **Extracts the function name** using regex (`useXxx` pattern)
3. **Counts grep hits** across `.vue` and `.ts` files, excluding tests and the source file
4. **Reports violations** and exits with code 1 if any composable falls below the threshold

## Example Output

When a single-use composable exists:

```
$ pnpm check:composables
⚠️  useUserGreeting (src/composables/useUserGreeting.ts) - only 1 usage(s), minimum is 2
```

When all composables meet the threshold:

```
$ pnpm check:composables
✓ All composables are used at least 2 times
```

## Integration Options

**CI Pipeline**: Add to your GitHub Actions or GitLab CI to catch violations in PRs.

```yaml
- name: Check composable usage
  run: pnpm check:composables
```

**Pre-commit Hook**: Add to `.husky/pre-commit` for local enforcement.

```bash
pnpm check:composables
```

## Limitations

- Counts grep matches, not semantic imports (re-exports count as usage)
- Only detects `export function useXxx` pattern
- Doesn't catch composables exported as arrow functions

For most projects, these edge cases are rare enough that the simple grep approach works well.

## Conclusion

Premature abstraction creates cognitive overhead without providing reuse benefits. This lightweight script enforces a practical rule: if you're putting a composable in a shared location, make sure it's actually shared.

The script takes 5 minutes to set up and catches architectural drift before it accumulates.
