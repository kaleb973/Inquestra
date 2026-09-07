---
trigger: always_on
---

# Strict API & Zero-Hallucination Rule

1. **Verify Before Writing**: Before writing any function call, import, method access, or library method, verify that it exists in the codebase or package version.
2. **No Guesses**: If an API signature or export path is uncertain, inspect the source file or package types first.
3. **No Made-Up Methods**: Never guess framework methods, parameters, or return types.
