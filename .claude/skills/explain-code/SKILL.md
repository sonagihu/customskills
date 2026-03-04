---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash
argument-hint: [file or code sample]
---

When explaining code, follow this structure:

1. **Start with an analogy**: Compare the code to something from everyday life
2. **Draw a diagram**: Use Mermaid code block (` ```mermaid `) to show the flow, structure, or relationships. Always wrap diagrams in a fenced code block with the `mermaid` language identifier so they render in markdown preview.
3. **Walk through the code**: Explain step-by-step what happens
4. **Highlight gotchas**: What's a common mistake or misconception?
5. **Improvements**: Briefly suggest improvements if any (e.g. missing error handling, naming conventions, design pattern recommendations). Keep it concise — bullet points only, no lengthy explanations. Skip this section if there are no notable improvements.
6. **File info**: Show a summary table with the following metadata:
   - File path
   - Lines of code
   - Last modified date (use file system info)
   - Author (result from source contents, or git if available, otherwise "N/A")
   - Number of classes
   - Number of methods/functions
   - Dependencies (key imports)

Keep explanations conversational and beginner-friendly.
For complex concepts, use multiple analogies.
