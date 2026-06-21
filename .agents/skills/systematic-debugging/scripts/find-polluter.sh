#!/usr/bin/env bash
# Bisection script to find which test creates unwanted files/state
# Usage: ./find-polluter.sh <file_or_dir_to_check> <test_pattern>
# Example: ./find-polluter.sh '.git' 'src/**/*.test.ts'
# Example: ./find-polluter.sh 'node_modules/.cache/pollution' 'src/features/**/*.test.ts'

set -e

if [ $# -ne 2 ]; then
  echo "Usage: $0 <file_to_check> <test_pattern>"
  echo "Example: $0 '.git' 'src/**/*.test.ts'"
  echo ""
  echo "Common patterns for this project:"
  echo "  src/**/*.test.ts           - All tests"
  echo "  src/features/**/*.test.ts  - Feature tests"
  echo "  src/__tests__/**/*.test.ts - Integration tests"
  exit 1
fi

POLLUTION_CHECK="$1"
TEST_PATTERN="$2"

echo "Searching for test that creates: $POLLUTION_CHECK"
echo "Test pattern: $TEST_PATTERN"
echo ""

# Get list of test files
TEST_FILES=$(find . -path "$TEST_PATTERN" | sort)
TOTAL=$(echo "$TEST_FILES" | wc -l | tr -d ' ')

echo "Found $TOTAL test files"
echo ""

# Check if pollution exists before we start
if [ -e "$POLLUTION_CHECK" ]; then
  echo "ERROR: Pollution already exists before running any tests!"
  echo "   Found: $POLLUTION_CHECK"
  echo ""
  echo "Please clean up the pollution before running this script:"
  echo "   rm -rf $POLLUTION_CHECK"
  exit 1
fi

COUNT=0
for TEST_FILE in $TEST_FILES; do
  COUNT=$((COUNT + 1))

  # Skip if pollution already exists
  if [ -e "$POLLUTION_CHECK" ]; then
    echo "Pollution already exists before test $COUNT/$TOTAL"
    echo "   Skipping: $TEST_FILE"
    continue
  fi

  echo "[$COUNT/$TOTAL] Testing: $TEST_FILE"

  # Run the test with pnpm
  pnpm test "$TEST_FILE" > /dev/null 2>&1 || true

  # Check if pollution appeared
  if [ -e "$POLLUTION_CHECK" ]; then
    echo ""
    echo "FOUND POLLUTER!"
    echo "   Test: $TEST_FILE"
    echo "   Created: $POLLUTION_CHECK"
    echo ""
    echo "Pollution details:"
    ls -la "$POLLUTION_CHECK"
    echo ""
    echo "To investigate:"
    echo "  pnpm test $TEST_FILE    # Run just this test"
    echo "  cat $TEST_FILE          # Review test code"
    exit 1
  fi
done

echo ""
echo "No polluter found - all tests clean!"
exit 0
