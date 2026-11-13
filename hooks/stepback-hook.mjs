#!/usr/bin/env node
// Advisory-only Claude Code UserPromptSubmit hook. No filesystem/network access.
const fs = await import('node:fs');

// Any one of these marks the prompt as a bug report or a repeat fix.
// Ambiguous words ("again", "error", "patch", "architecture", "refactor") only count
// inside phrases, because on their own they turn up in ordinary requests
// ("try again", "add error handling", "bump the patch version").
const BUG_SIGNALS = [
  // Something is failing.
  /\b(bugs?|buggy|defects?|regressions?|regressed|flaky|segfaults?|traceback|stack ?traces?)\b/i,
  /\b(crash(es|ed|ing)?|broke|broken|fail(s|ed|ing|ures?)|hangs|freezes)\b/i,
  /\b((is|are|was|were|does|did|do)(n['’]?t| not) work(s|ing)?|stopped working|no longer works?)\b/i,
  // Someone describes hitting an error, as opposed to asking for error handling.
  /\b(getting|gets|got|seeing|sees|saw|hitting|hits|throws|threw|throwing|raises|raised|raising)( (an?|the|this|that|some))?( [\w.-]+)? \w*(error|exception)s?\b/i,
  /\b(unhandled|uncaught) \w*(error|exception|rejection)s?\b/i,
  // Pasted error output, e.g. "TypeError: x is undefined" or "error[E0382]: ...". Case-sensitive on purpose.
  /\b([A-Z]\w*)?(Error|Exception):/,
  /^[ \t]*error(\[\w+\])?:/m,
  // Edge cases and stopgaps.
  /\b(edge|corner|boundary) cases?\b/i,
  /\b(workarounds?|hotfix(es)?|root cause|whack[- ]a[- ]mole)\b/i,
  // The same problem coming back.
  /\b(keeps? (breaking|failing|crashing|happening|coming back)|same (issue|bug|error|problem|crash)|another (fix|patch|workaround|hotfix)|(fix|fixed|patch|patched) (it |this |that )?(again|before|last time)|happening again)\b/i,
  /\b(recur(s|red|ring)|reappear(s|ed|ing)?|resurfac(es|ed|ing))\b/i
];

// An explicit request for a narrow fix turns the nudge off, even when bug words are present.
const NARROW_FIX = [
  // "just patch it", "I only want a minimal fix" -- but not "not just a patch" or "the only fix".
  /(?<!(\bnot|\bthan|\bthe|n['’]t)\s)\b(just|only|simply) ((want|need|give me|do|apply|make|write) )?((a|an|the) )?((quick|small|simple|minimal|narrow|local|targeted|surgical|one[- ]line) )?(fix|patch|hotfix)\b/i,
  /\b(minimal|narrow|local|targeted|surgical|one[- ]line|smallest( possible)?) (fix|patch|hotfix|change)\b/i,
  /\b(fix|patch|hotfix) only\b/i,
  /\b((don['’]?t|do not|no need to|without) (refactor(ing)?|redesign(ing)?|rethink(ing)?|restructur(e|ing)|re-?architect(ing)?)|no (refactor(ing)?|redesign))\b/i
];

export function wantsNarrowFix(prompt) {
  return typeof prompt === 'string' && NARROW_FIX.some((pattern) => pattern.test(prompt));
}

export function shouldNudge(prompt) {
  if (typeof prompt !== 'string' || prompt.trim().length === 0) return false;
  if (wantsNarrowFix(prompt)) return false;
  return BUG_SIGNALS.some((pattern) => pattern.test(prompt));
}

export function buildOutput(prompt) {
  if (!shouldNudge(prompt)) return null;
  return {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: [
        'StepBack reminder: before choosing a fix, distinguish an isolated defect from a systemic design issue.',
        'Check the violated invariant and nearby paths. Consider PATCH, REFACTOR, REDESIGN, or INVESTIGATE, but do not force a redesign.',
        'Respect an explicit request for a narrow fix. Keep claims evidence-based and state uncertainty.'
      ].join(' ')
    }
  };
}

const invokedDirectly = process.argv[1] && new URL(import.meta.url).pathname === new URL(`file://${process.argv[1]}`).pathname;
if (invokedDirectly) {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    // Strip a UTF-8 BOM: Windows PowerShell 5.1 prepends one when piping to native commands.
    const payload = JSON.parse(raw.replace(/^﻿/, '') || '{}');
    const prompt = payload.prompt ?? payload.user_prompt ?? '';
    const output = buildOutput(prompt);
    if (output) process.stdout.write(`${JSON.stringify(output)}\n`);
  } catch {
    // Fail open: malformed input must never block the user's prompt.
    process.exitCode = 0;
  }
}
