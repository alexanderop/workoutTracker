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
