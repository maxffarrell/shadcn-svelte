---
name: shadcn-radix-parity
description: Audit and repair shadcn-svelte component docs/examples so they match shadcn/ui v4 Radix docs/examples in behavior and visuals with minimal diffs. Use when working on docs parity under docs/content/components, example parity under docs/src/lib/registry/examples, or when generating parity-report.json and parity-report.md.
---

# Shadcn Radix Parity

Enforce parity between local shadcn-svelte docs/examples and upstream shadcn/ui v4 Radix docs/examples.

## Runbook

1. Build inventory and mappings:
   - `node .codex/skills/shadcn-radix-parity/scripts/inventory.mjs`
2. Run audit and repair (default mode is `repair`):
   - `node .codex/skills/shadcn-radix-parity/scripts/audit.mjs --mode repair`
3. Re-render report markdown:
   - `node .codex/skills/shadcn-radix-parity/scripts/render-report.mjs`
4. Validate project:
   - `pnpm -F docs check`
   - `pnpm -F docs build`

## Scope Rules

- Treat `/docs/content/components/*.md` as source docs.
- Resolve examples from `<ComponentPreview name="...">` using:
  - `/docs/src/lib/registry/examples/<name>.svelte` for standard examples.
  - `/docs/src/lib/registry/blocks/...` for block-style previews that follow the existing docs routing rules.
- Ignore local-only components with no upstream Radix doc page and report them as `missing`.
- Use upstream `main` branch as moving ground truth.

## Required Outputs

- `/parity-report.json` with per-component statuses: `ok | updated | missing | blocked`.
- `/parity-report.md` concise summary derived from JSON.
- Minimal edits to local docs/examples only when required for parity.

## Subagent Orchestration

Use specialized subagents aggressively:

1. Indexer Agent:
   - Own inventory generation and doc/example mapping verification.
2. Docs Diff Agent:
   - Own markdown parity diffs and doc edit proposals.
3. Example Diff Agent:
   - Own behavior/visual diff notes between local Svelte and upstream TSX examples.
4. Conversion Agent:
   - Own TSX to Svelte conversion for missing/divergent examples.
5. Primitive Gap Agent:
   - Own blocked parity entries and minimal primitive API proposal text.
6. QA Agent:
   - Own `docs check`, `docs build`, and report synthesis.

## Guardrails

- Never change upstream intent.
- Preserve Svelte-specific syntax only where necessary.
- Prefer existing Bits UI and local shadcn-svelte primitives.
- Avoid brittle DOM hacks.
- Keep diffs minimal.
- Do not auto-commit.

## References

- Mapping and fallback rules: `references/mapping-rules.md`
- Parity checklist: `references/parity-checklist.md`

