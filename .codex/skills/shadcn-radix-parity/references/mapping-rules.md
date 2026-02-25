# Mapping Rules

## Local Paths

- Docs root: `docs/content/components`
- Example root: `docs/src/lib/registry/examples`
- Block preview root: `docs/src/lib/registry/blocks`

## Doc Mapping

1. Use local markdown basename as default upstream Radix doc slug.
   - Example: `docs/content/components/dropdown-menu.md` -> `dropdown-menu`.
2. Resolve upstream doc from:
   - `apps/v4/content/docs/components/radix/<slug>.mdx`
   - fallback: `apps/v4/content/docs/components/radix/<slug>.md`
3. If no upstream file exists, mark component status as `missing` and skip content edits.

## Example Reference Extraction

- Parse all `<ComponentPreview name="...">` occurrences in each local component doc.
- Preserve occurrence counts for parity checks.

## Local Example Path Resolution

Classify preview names with existing local docs routing logic:

1. `name` contains `sidebar` -> block preview.
2. `name` starts with `chart-` and does not contain `demo` -> block preview.
3. `name` starts with `calendar-` and does not contain `demo` -> block preview.
4. Otherwise -> standard example preview.

Resolution:

- Standard example:
  - `docs/src/lib/registry/examples/<name>.svelte`
- Block preview candidates:
  - `docs/src/lib/registry/blocks/<name>.svelte`
  - `docs/src/lib/registry/blocks/<name>/+page.svelte`

## Upstream Example Mapping

Given local example name `<name>`:

1. Exact match: `apps/v4/examples/radix/<name>.tsx`
2. Fallback candidates:
   - remove `-demo` suffix
   - add `-demo` suffix
   - remove `-example` suffix
3. Normalized fallback:
   - normalize by removing non-alphanumeric chars and optional `demo` suffix
   - accept only if exactly one upstream candidate matches.
4. If ambiguous, mark as `blocked` and require manual mapping.

