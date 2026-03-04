---
name: todo
description: Find and list all TODO, FIXME, HACK comments in the codebase
disable-model-invocation: true
---

Search the entire codebase for TODO, FIXME, HACK, and XXX comments.

## Output Format
Group results by type and file:

### TODO
- `file:line` - description

### FIXME
- `file:line` - description

### HACK
- `file:line` - description

Provide a summary count at the end.
