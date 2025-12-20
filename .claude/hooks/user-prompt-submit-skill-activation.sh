#!/bin/bash
#
# Claude Code UserPromptSubmit Hook - Skill Auto-Activation
#
# Automatically injects relevant skill content when user prompts
# match defined trigger keywords from skill-rules.json.
#
# Suppression: Add --no-skill or --skip-skills to skip activation.

# Read JSON input from stdin
INPUT=$(cat)

# Extract prompt and cwd using jq
PROMPT=$(echo "$INPUT" | jq -r '.prompt // ""')
CWD=$(echo "$INPUT" | jq -r '.cwd // ""')

# Check for suppression flags
if echo "$PROMPT" | grep -qiE '\-\-no-skill|\-\-skip-skills?'; then
  exit 0
fi

# Path to skill rules
RULES_PATH="$CWD/.claude/hooks/skill-rules.json"

if [[ ! -f "$RULES_PATH" ]]; then
  exit 0
fi

MATCHED_SKILLS=""
MATCHED_CONTENT=""

# Get number of rules
RULE_COUNT=$(jq 'length' "$RULES_PATH")

# Process each rule
for ((i=0; i<RULE_COUNT; i++)); do
  NAME=$(jq -r ".[$i].name" "$RULES_PATH")
  SKILL_PATH=$(jq -r ".[$i].path" "$RULES_PATH")

  # Get triggers as newline-separated list
  TRIGGERS=$(jq -r ".[$i].triggers[]" "$RULES_PATH")

  # Check each trigger against the prompt
  MATCHED=0
  while IFS= read -r trigger; do
    if [[ -z "$trigger" ]]; then
      continue
    fi
    # Try regex match
    if echo "$PROMPT" | grep -qiE "$trigger" 2>/dev/null; then
      MATCHED=1
      break
    fi
  done <<< "$TRIGGERS"

  if [[ "$MATCHED" -eq 1 ]]; then
    FULL_SKILL_PATH="$CWD/$SKILL_PATH"
    if [[ -f "$FULL_SKILL_PATH" ]]; then
      if [[ -n "$MATCHED_SKILLS" ]]; then
        MATCHED_SKILLS="$MATCHED_SKILLS, $NAME"
      else
        MATCHED_SKILLS="$NAME"
      fi
      MATCHED_CONTENT="$MATCHED_CONTENT
--- $NAME ---
$(cat "$FULL_SKILL_PATH")
"
    fi
  fi
done

# Output matched skills
if [[ -n "$MATCHED_SKILLS" ]]; then
  echo ""
  echo "=== Auto-Activated Skills ==="
  echo "Skills activated: $MATCHED_SKILLS"
  echo ""
  echo "$MATCHED_CONTENT"
  echo "=== End Skills ==="
  echo ""

  # User-visible notification (stderr, visible in verbose mode)
  echo -e "\033[36m⚡ Skills: $MATCHED_SKILLS\033[0m" >&2
fi

exit 0
