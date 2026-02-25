# Parity Checklist

## Doc Parity

- Confirm upstream Radix doc exists for the local component slug.
- Compare structure:
  - headings and section order
  - examples list and order
  - accessibility notes presence
  - API/usage intent alignment
- Preserve Svelte-specific syntax and install notes where framework-specific.

## Example Functional Parity

- Compare composition hierarchy and slots.
- Compare state/control behavior:
  - controlled and uncontrolled patterns
  - event handlers and side effects
- Compare interaction and accessibility:
  - keyboard navigation
  - focus behavior
  - roles and aria attributes
  - open/close and state transitions

## Example Visual Parity

- Compare class/variant intent.
- Compare spacing/layout primitives (stacking, width, alignment, portal positioning intent).
- Compare typography and icon usage intent.

## Repair Rules

- Prefer minimal diffs.
- Use existing local components and Bits UI wrappers first.
- Do not simplify upstream examples.
- Avoid brittle DOM hacks.
- If parity needs missing primitive behavior:
  - mark status as `blocked`
  - capture missing behavior and smallest API addition proposal.

## Validation

- Run:
  - `pnpm -F docs check`
  - `pnpm -F docs build`
- Spot-check changed examples against local `/view/*` or docs preview and upstream docs/examples.
- Ensure report files are generated and include assumptions + blocked parity entries.

