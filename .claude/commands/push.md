---
description: Commit staged changes and push to remote
allowed-tools: Bash(git status), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git rev-parse:*), Bash(git remote:*)
model: haiku
---

# Commit and Push

I have gathered information about your changes. Here are the results:

<git_status>
!`git status`
</git_status>

<staged_diff>
!`git diff --cached`
</staged_diff>

<unstaged_diff>
!`git diff`
</unstaged_diff>

<recent_commits>
!`git log --oneline -10`
</recent_commits>

<current_branch>
!`git rev-parse --abbrev-ref HEAD`
</current_branch>

<remote_info>
!`git remote -v`
</remote_info>

## Instructions

### Step 1: Commit (if there are changes)

1. **Analyze the diffs** above to understand what changed.
2. **Stage files** if needed (skip already staged files, skip files that shouldn't be committed like `.env`).
3. **Generate a conventional commit message** following this format:
   ```text
   <type>(<scope>): <description>

   [optional body]
   ```

   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

4. **Create the commit** using a HEREDOC for proper formatting:
   ```bash
   git commit -m "$(cat <<'EOF'
   type(scope): description
   EOF
   )"
   ```

### Step 2: Push

5. **Push to remote** using the current branch:
   ```bash
   git push origin <current-branch>
   ```

   If the branch doesn't have an upstream, use:
   ```bash
   git push -u origin <current-branch>
   ```

6. **Show the result** with `git log -1` to confirm the commit, and verify the push succeeded.
