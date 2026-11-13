# Architecture

## Layers

1. **Cross-surface reasoning layer:** the `architectural-reconsideration` skill and four slash commands. These are the portable behavior surface.
2. **Hybrid trigger layer:** the Claude Code `UserPromptSubmit` hook detects a small set of prompt phrases and appends a reminder. It is advisory, stateless, and fail-open.
3. **Specialist reasoning layer:** four subagents divide root-cause investigation, architecture critique, alternative design, and edge-case analysis. They report evidence and recommendations; they do not edit files.
4. **Implementation layer:** the main Claude session makes changes only when the user asks, then verifies them.

## Why no always-on autonomous rewrite loop?

Architectural reconsideration has a real cost. Running a multi-agent review for every small change increases latency, token use, and the chance of unnecessary redesign. StepBack therefore uses a hybrid trigger and a decision gate. The hook only nudges; the skill determines whether deeper analysis is warranted.

## Decision state machine

```text
Problem received
      |
      v
Frame expected vs actual behavior
      |
      v
Inspect evidence and reconstruct invariant
      |
      v
Root cause sufficiently understood?
   /              \\
 no                yes
 |                  |
INVESTIGATE      Isolated defect?
                    /      \\
                  yes       no
                   |         |
                 PATCH   Is internal structure sound?
                            /       \\
                          yes        no
                           |          |
                        REFACTOR   Wrong model/contract?
                                      /      \\
                                    yes       unclear
                                     |          |
                                  REDESIGN  INVESTIGATE
      |
      v
Test original + adjacent cases + regressions
      |
      v
Report residual risk and confidence
```

## Surface compatibility

- Claude web chat and Claude Desktop chat: skills and commands are available through account plugins. Ordinary chat does not execute hooks or subagents.
- Claude Cowork: plugin skills/commands plus supported hooks and subagents.
- Claude Code: full plugin components on the local development machine.
- Account-synced plugins require supported Claude Code sign-in/version conditions. Local `--plugin-dir` remains available for development.
