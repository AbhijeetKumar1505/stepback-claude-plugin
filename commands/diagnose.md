---
name: diagnose
description: Trace a bug to its root cause and determine whether it is local or architectural.
argument-hint: [failure, error, or failing test]
---

Diagnose **$ARGUMENTS** beyond the first failing line.

1. Reproduce or inspect the failure using available evidence. Do not claim to have run tests that were not run.
2. Trace the data/control path and identify the violated invariant.
3. Check whether similar code paths share the same assumption or abstraction.
4. Classify the cause as local, systemic, or unknown.
5. Propose the smallest adequate correction and at least one alternative if systemic.
6. Identify tests that cover the original failure, adjacent boundaries, and regressions.

Do not edit until the user has asked for a fix. Output a concise root-cause report and a recommended PATCH / REFACTOR / REDESIGN / INVESTIGATE decision.
