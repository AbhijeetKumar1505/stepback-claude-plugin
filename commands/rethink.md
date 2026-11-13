---
name: rethink
description: Reconsider a design or implementation from first principles before making another patch.
argument-hint: [area, decision, or problem]
---

Use the StepBack architectural-reconsideration workflow for: **$ARGUMENTS**

Do not start by editing code. First:
1. Restate the intended behavior, constraints, and what is failing.
2. Inspect the relevant implementation, tests, call sites, and dependency boundaries available in this environment.
3. Separate observed facts, assumptions, and unknowns.
4. Identify the invariant or design decision that makes the behavior possible.
5. Generate at least two materially different options when a systemic issue is plausible, including a bounded patch option.
6. Compare patch/refactor/redesign/investigate using correctness, complexity, migration risk, reversibility, and future failure surface.
7. Recommend one option with evidence and explain why the alternatives are weaker.

Do not force a redesign. If a patch is the best engineering choice, say so. Ask before broad or destructive changes. If implementation is requested, make the smallest coherent change and run focused plus regression tests.
