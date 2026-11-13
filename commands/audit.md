---
name: audit
description: Audit a bounded codebase area for architectural assumptions and clusters of edge-case risk.
argument-hint: [scope or subsystem]
---

Perform a bounded StepBack audit of **$ARGUMENTS**.

Inspect only the requested scope and its necessary dependencies. Look for duplicated workarounds, defensive checks compensating for unclear contracts, state spread across layers, cyclic dependencies, leaky abstractions, inconsistent invariants, and tests that encode symptoms rather than behavior.

For each finding provide evidence (file/symbol/test when available), impact, confidence, and the smallest meaningful next step. Group related symptoms under a possible shared cause. Do not recommend a rewrite without showing why incremental changes cannot address the root cause. Do not edit files.
