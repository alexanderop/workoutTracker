---
name: tag
description: Compute the next semver version from Conventional Commits since the last tag (major/minor/patch), create an annotated git tag, and push it. Use when the user says "tag a release", "bump version", "cut a release", or "create version tag".
allowed-tools: Bash(git tag:*), Bash(git log:*), Bash(git describe:*), Bash(git rev-parse:*), Bash(git push:*)
---

# Semantic Version Tag

I have gathered information about your repository. Here are the results:

<current_tag>
!`git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"`
</current_tag>

<commits_since_tag>
!`git log $(git describe --tags --abbrev=0 2>/dev/null || echo "")..HEAD --oneline --no-decorate 2>/dev/null || git log --oneline --no-decorate`
</commits_since_tag>

<current_branch>
!`git rev-parse --abbrev-ref HEAD`
</current_branch>

## Instructions

### Step 1: Determine Version Bump

Analyze the commits since the last tag using **Conventional Commits** rules:

| Commit Pattern | Bump Type |
|----------------|-----------|
| BREAKING CHANGE: in body/footer | **MAJOR** |
| feat! or fix! (breaking change marker) | **MAJOR** |
| feat: | **MINOR** |
| fix:, perf: | **PATCH** |
| docs:, style:, refactor:, test:, build:, ci:, chore: | **PATCH** |

**Priority**: MAJOR > MINOR > PATCH (use the highest applicable bump)

### Step 2: Calculate New Version

Given current version `vX.Y.Z`:
- **MAJOR**: `v(X+1).0.0`
- **MINOR**: `vX.(Y+1).0`
- **PATCH**: `vX.Y.(Z+1)`

### Step 3: Create and Push Tag

1. **Show the user** the proposed version bump with reasoning
2. **Create the tag** with an annotated message summarizing changes:
   ```bash
   git tag -a vX.Y.Z -m "$(cat <<'EOF'
   vX.Y.Z

   Changes:
   - feat: description
   - fix: description
   EOF
   )"
   ```

3. **Push the tag**:
   ```bash
   git push origin vX.Y.Z
   ```

4. **Confirm** with `git describe --tags`

### Notes

- If no commits since last tag, inform the user and don't create a tag
- If no previous tags exist, start from `v0.0.0` and bump accordingly
- Always use `v` prefix for tags (e.g., `v1.2.3`)
