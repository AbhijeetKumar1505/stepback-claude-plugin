---
name: challenge
description: Adversarially challenge an existing design decision, abstraction, or implementation.
argument-hint: [decision, abstraction, or file path]
---

Challenge **$ARGUMENTS** as a thoughtful senior engineer reviewing a system, not as a stylistic critic.

Evaluate:
- What problem was this design likely intended to solve?
- Which assumptions must remain true for it to work?
- Which invariants does it enforce, and which does it merely hope callers respect?
- What edge cases or future requirements expose its limits?
- Is complexity located at the right boundary?
- What alternative model would remove the need for special cases?
- What evidence would falsify your criticism?

Return: (1) strongest case for keeping it, (2) strongest case against it, (3) concrete failure modes, (4) alternatives, (5) recommendation and confidence. Do not change files unless explicitly asked.
