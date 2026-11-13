# StepBack

**Step back before you patch.** StepBack is a Claude plugin for architectural reconsideration. It helps Claude distinguish a local defect from a systemic design flaw, challenge assumptions inherited from the codebase, compare alternative designs, and verify fixes against classes of edge cases.

StepBack is deliberately **hybrid**:

- Skills can activate when the task context calls for architectural reconsideration.
- A lightweight `UserPromptSubmit` hook adds a reminder for bug/failure/repeated-patch prompts. It never edits files, blocks tools, or runs shell commands from project content.
- Slash commands provide explicit control.
- Specialist subagents are available in Claude Code and Cowork surfaces that support subagents.
- The core skill and commands are designed to be useful in Claude chat on web/Desktop too. Hooks and subagents are not available in ordinary chat.

## What StepBack does

1. Reconstruct the intended behavior and relevant system boundaries.
2. Trace the failure to a root cause, separating evidence from hypotheses.
3. Ask whether the defect is local, systemic, or an unknown requiring more evidence.
4. Generate materially different options: patch, refactor, redesign, or defer/investigate.
5. Compare options by correctness, complexity, migration risk, reversibility, and future failure surface.
6. Recommend the smallest change that solves the actual problem, not automatically the largest redesign.
7. Verify the original case, related edge cases, and regressions.

## Commands

| Command | Use |
|---|---|
| `/stepback:rethink [area or problem]` | Reconsider a design from first principles. |
| `/stepback:challenge [decision or implementation]` | Adversarially inspect an existing design decision. |
| `/stepback:diagnose [failure]` | Investigate a bug beyond its immediate failing case. |
| `/stepback:audit [scope]` | Find architectural risks and clusters of related edge cases. |

## Install in Claude Code

### Local development install

Clone the [repository](https://github.com/AbhijeetKumar1505/stepback-claude-plugin) and point Claude Code at it:

```bash
git clone https://github.com/AbhijeetKumar1505/stepback-claude-plugin.git
claude --plugin-dir ./stepback-claude-plugin
```

`--plugin-dir` takes the folder that contains `.claude-plugin/plugin.json` (its name doesn't matter). From inside that folder, use `claude --plugin-dir .`. For iterative development, restart Claude Code after changing plugin metadata or components if changes are not picked up.

### Marketplace install

This repository is also a plugin marketplace (`.claude-plugin/marketplace.json`). In Claude Code 2.1.275 or later, install in one step:

```text
/plugin install stepback --marketplace AbhijeetKumar1505/stepback-claude-plugin
```

On older versions, add the marketplace first, then install:

```text
/plugin marketplace add AbhijeetKumar1505/stepback-claude-plugin
/plugin install stepback@stepback-marketplace
```

## Install in Claude on the web or Desktop

Current Claude plugins can be uploaded from **Customize → Plugins**. Upload a ZIP of the plugin directory (the archive must contain `.claude-plugin/plugin.json` at its root), then add/enable it. Plugins added to a Claude account can sync to Claude Code when signed in with the same account and a supported Claude Code version.

Skills and commands are the cross-surface layer. Hooks and subagents run in Cowork and Claude Code, not ordinary Claude chat. See [Anthropic's plugin guide](https://support.claude.com/en/articles/13837440-use-plugins-in-claude).

## Hybrid trigger behavior

The hook listens only to `UserPromptSubmit`. It checks the user's submitted prompt for a small set of bug/failure/repetition signals and emits a short `additionalContext` reminder. It does **not** infer from source code, inspect the repository, persist project data, call external services, or change the user's request. The skill provides the deeper workflow when relevant. Users can bypass it by saying they only want a narrow/local fix.

## Decision policy

StepBack must not turn every bug into an architecture project. It should prefer a local patch when evidence shows the defect is isolated and the patch preserves a coherent invariant. It should recommend redesign only when a broader model/contract/abstraction is demonstrably responsible or when repeated local fixes are increasing complexity.

### Decision outputs

- **PATCH**: isolated implementation defect, stable contract, bounded regression surface.
- **REFACTOR**: sound behavior/model, poor internal structure; preserve external behavior.
- **REDESIGN**: current abstraction, contract, state model, or dependency boundary causes a class of failures.
- **INVESTIGATE**: insufficient evidence to choose safely.

## Repository layout

```text
stepback-claude-plugin/
├── .claude-plugin/plugin.json
├── .claude-plugin/marketplace.json
├── agents/                    # specialist subagents
├── commands/                  # explicit slash commands
├── hooks/hooks.json           # low-noise hybrid trigger
├── hooks/stepback-hook.mjs    # stdlib-only Node hook
├── skills/architectural-reconsideration/SKILL.md
├── tests/                     # Node built-in test runner
├── docs/                       # architecture, security, evaluation
├── .github/workflows/ci.yml
├── package.json
├── LICENSE
└── README.md
```

## Development and tests

Requires Node.js 20+ for the hook and tests. The plugin itself has no runtime dependencies.

```bash
npm test
npm run validate
```

`npm test` tests trigger detection and hook output. `npm run validate` validates JSON files and checks required plugin files exist. These are structural tests, not a substitute for installing the plugin in Claude and exercising it in a real project.

To change the plugin icon, edit `docs/icon-source.svg` and run `npm run icon`. It renders `.claude-plugin/icon.png` (1024×1024) with a locally installed Chrome, Edge or Chromium (set `CHROME_PATH` to choose one). If the SVG is malformed or the render comes out blank, it leaves the existing icon unchanged.

## Safety and privacy

- No network calls, telemetry, or external API keys.
- No automatic file edits or command execution from hooks.
- The hook reads only the submitted prompt payload on stdin and emits advisory context.
- Subagents are instructed to inspect before proposing changes and to request approval before destructive or broad migrations.
- StepBack must state uncertainty and distinguish observed facts from hypotheses.

## Known limitations

- Claude chat on web/Desktop can use the plugin's skills and commands, but not the hook or subagent runtime in ordinary chat.
- Automatic triggering is heuristic. It is a nudge, not a classifier or guarantee.
- Architectural recommendations depend on the repository context Claude can actually inspect.
- No plugin can guarantee that an LLM will always choose a correct abstraction. Use tests, reviews, and staged changes.

## License

MIT. See [LICENSE](LICENSE).
