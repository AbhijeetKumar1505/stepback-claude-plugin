#!/usr/bin/env node
// Advisory-only Claude Code UserPromptSubmit hook. No filesystem/network access.
const fs = await import('node:fs');

const TRIGGERS = [
  /\b(bug|buggy|defect|failure|failing|fails|regression|error|exception)\b/i,
  /\b(edge[- ]case|corner case|boundary case|workaround|hotfix|patch)\b/i,
  /\b(again|repeatedly|keeps breaking|same issue|another fix|quick fix)\b/i,
  /\b(refactor|redesign|architecture|root cause|design decision)\b/i
];

export function shouldNudge(prompt) {
  if (typeof prompt !== 'string' || prompt.trim().length === 0) return false;
  return TRIGGERS.some((pattern) => pattern.test(prompt));
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
