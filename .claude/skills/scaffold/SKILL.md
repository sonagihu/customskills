---
name: scaffold
description: Scaffold a new Claude Code skill from a template
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Write, Glob
argument-hint: [skill-name]
---

Create a new skill named `$0` in `.claude/skills/$0/`.

## Steps

1. Create the directory `.claude/skills/$0/`
2. Generate a `SKILL.md` with the following template:

```yaml
---
name: $0
description: TODO - describe what this skill does
user-invocable: true
allowed-tools: Read, Grep, Glob
argument-hint: [arguments]
---

TODO - Write the skill instructions here.
```

3. Confirm the skill was created and remind the user to:
   - Update the `description` field
   - Fill in the skill instructions
   - Test with `/$0`
