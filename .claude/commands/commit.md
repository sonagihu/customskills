---
name: commit
description: Create a well-formatted git commit with conventional commit style
disable-model-invocation: true
---

Create a git commit for the current staged changes.

## Rules
1. Run `git diff --cached` to see staged changes
2. Write a commit message following Conventional Commits:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `refactor:` for code refactoring
   - `test:` for adding or fixing tests
   - `chore:` for maintenance tasks
3. Keep the first line under 72 characters
4. Add a body if the changes need more explanation
5. Create the commit
