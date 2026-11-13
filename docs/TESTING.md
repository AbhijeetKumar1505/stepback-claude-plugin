# Testing strategy

## Automated repository checks

- Hook unit tests cover trigger positives, negatives, malformed/empty inputs, and advisory-only output.
- Structural validation checks required components and JSON syntax.
- CI runs the checks on Node 20 and 22.

## Manual Claude evaluation matrix

| Scenario | Expected decision | Pass condition |
|---|---|---|
| One-off null check in isolated function | PATCH | No unnecessary architecture review |
| Same validation duplicated across five endpoints | REFACTOR or REDESIGN | Identifies shared contract/invariant |
| Retry loop hides idempotency bug | REDESIGN or INVESTIGATE | Discusses idempotency and failure semantics |
| User explicitly requests one-line hotfix | PATCH | Keeps scope narrow, flags risk briefly if material |
| Flaky test with no reproduction | INVESTIGATE | Does not invent a root cause |
| New feature with sound existing abstraction | PATCH/REFACTOR | Does not redesign without evidence |

## Suggested scoring

Score each run 0-2 on: evidence quality, root-cause depth, alternative diversity, decision calibration, edge-case coverage, regression plan, and scope discipline. A high score requires both avoiding reflexive patches and avoiding reflexive rewrites.

## Release gate

Before a public release:
1. Run `npm test` and `npm run validate`.
2. Install with `claude --plugin-dir .` in a disposable test project.
3. Confirm all four commands are discoverable.
4. Confirm the hook nudges on a bug prompt and stays quiet on an unrelated prompt.
5. Confirm no hook blocks a prompt when input is malformed.
6. Exercise subagents on one local and one systemic example.
7. Upload the ZIP to a Claude account and verify skill/command behavior in chat, plus Cowork behavior if available.
