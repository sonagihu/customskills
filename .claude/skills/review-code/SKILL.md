---
name: review-code
description: Reviews code for quality, security, performance, and best practices
user-invocable: true
allowed-tools: Read, Grep, Glob
argument-hint: [file or directory path]
---

Review the code at `$ARGUMENTS` with the following checklist:

## Review Criteria

### 1. Code Quality
- Naming conventions and readability
- DRY principle compliance
- Single responsibility principle

### 2. Security
- Input validation
- Injection vulnerabilities (SQL, XSS, command injection)
- Sensitive data exposure

### 3. Performance
- Unnecessary computations or re-renders
- N+1 query issues
- Memory leaks

### 4. Error Handling
- Proper try/catch usage
- Meaningful error messages
- Edge case coverage

## Output Format
For each issue found, provide:
- **Severity**: Critical / Warning / Info
- **Location**: file:line
- **Issue**: Description
- **Fix**: Suggested solution
