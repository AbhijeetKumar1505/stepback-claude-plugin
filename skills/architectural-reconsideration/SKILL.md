---
name: architectural-reconsideration
description: Use when debugging recurring failures, handling edge cases, reviewing a proposed patch, refactoring, changing an abstraction, or when the current implementation seems to require another workaround. Helps decide whether to patch, refactor, redesign, or investigate.
version: 0.1.0
---

# StepBack: Architectural Reconsideration

## Mission

Before extending a system with another special case, determine whether the current design is the source of a broader class of failures. Think at two scales: the failing execution and the system model that produced it.

## Operating principles

1. **Evidence before architecture.** Inspect relevant code, tests, call sites, interfaces, data flow, and constraints before making claims.
2. **Do not worship novelty.** Existing patterns may be correct. Challenge them with evidence, not because a rewrite sounds cleaner.
3. **No patch reflex.** A passing test for one input does not prove the design is sound.
4. **No rewrite reflex.** A local defect does not justify replacing a subsystem.
5. **Preserve invariants.** State the invariants explicitly and verify the proposed design makes them easier to maintain.
6. **Separate facts from hypotheses.** Label uncertainty and propose the cheapest experiment that could resolve it.
7. **Respect user intent.** If the user explicitly asks for a narrow fix, keep scope narrow while briefly flagging material systemic risk.
8. **Minimize blast radius.** Prefer reversible, staged changes with tests and migration plans.

## Workflow

### 1. Frame the problem

Write down:
- Expected behavior and actual behavior.
- Reproduction conditions and affected boundaries.
- Constraints: compatibility, performance, security, latency, data integrity, deadlines, migration limits.
- What evidence is available and what is missing.

### 2. Reconstruct the system model

Trace relevant inputs, transformations, state transitions, outputs, and side effects. Identify the contract between components and the invariant that should hold. Inspect neighboring call sites and tests where feasible. Do not infer the whole architecture from one file.

### 3. Find the root cause

Ask:
- Which assumption is false?
- At what boundary does invalid state first become possible?
- Is the failure caused by a local implementation mistake, an ambiguous contract, a wrong abstraction, a distributed invariant, or an external dependency?
- Are multiple edge cases different manifestations of the same cause?
- Are previous fixes accumulating branches or duplicated checks?

Use causal language carefully. A correlation or suspicious code pattern is not proof.

### 4. Generate options

Consider the relevant options, not necessarily all four:

- **PATCH:** correct a bounded defect while retaining the model.
- **REFACTOR:** improve internal structure while preserving behavior and contracts.
- **REDESIGN:** change a flawed abstraction, contract, state model, or boundary to remove a class of defects.
- **INVESTIGATE:** gather evidence before changing a system whose behavior or constraints are unclear.

When a systemic cause is plausible, compare at least two materially different approaches. Do not create fake alternatives that differ only in naming.

### 5. Compare options

Evaluate each option against:
- Correctness and invariant coverage.
- Edge-case generalization.
- Complexity added and removed.
- Compatibility and migration cost.
- Operational, security, and performance risk.
- Reversibility and rollback path.
- Testability and observability.
- Future change surface.

Choose the smallest option that fixes the root cause with acceptable risk. State why a more ambitious redesign is not justified when rejecting it.

### 6. Verify

Build a test matrix:
- Original reproduction.
- Boundary values and malformed/unexpected inputs.
- Neighboring code paths sharing the invariant.
- Regression tests for previously fixed cases.
- Compatibility and migration checks where relevant.

Run available tests and report exact commands/results. If tests cannot be run, say why and provide the next verification step.

## Decision rubric

Use this rubric as guidance, not a numerical truth machine:

| Signal | PATCH | REFACTOR | REDESIGN | INVESTIGATE |
|---|---|---|---|---|
| Root cause | isolated defect | tangled implementation | wrong model/contract | unknown |
| Similar failures | unlikely | caused by structure | same flawed assumption | evidence incomplete |
| Invariant | already clear | valid but obscured | not representable/enforced | unclear |
| Risk | bounded | moderate | migration/system-wide | change risk unknown |

## Required response format

For non-trivial reconsideration, return:

1. **Observed problem**
2. **System model and invariant**
3. **Root cause** (facts vs hypotheses)
4. **Options considered**
5. **Decision:** PATCH / REFACTOR / REDESIGN / INVESTIGATE
6. **Why this is the smallest adequate move**
7. **Verification plan/results**
8. **Residual risks and confidence**

Keep the report proportional to the problem. Do not produce an architecture essay for a typo.

## Escalation signals

Pause before another local patch and reconsider the design when one or more are evidenced:
- Multiple fixes add special cases for the same underlying condition.
- The same invariant is reimplemented in multiple layers.
- Callers must know undocumented implementation details.
- A component's public contract cannot express valid states cleanly.
- Fixing one edge case repeatedly breaks another.
- State ownership or lifecycle is ambiguous.
- Tests pass only when execution order or hidden global state happens to align.

These are signals to investigate, not automatic proof that redesign is needed.
