# TypeScript 7.1 beta experiment

Date: 2026-10-31. Baseline: `fe4b0ad3b8b30c6745346db008c3307b5afeabb1`. Candidate: exact `typescript@7.1.0-beta` (the published beta tag at measurement time).

## Method

Linux x86_64 cloud VM, 5 visible Intel Xeon Platinum 8573C CPUs, Node 24.22.1, pnpm 12.14.0. Three consecutive fresh command processes (except the final BPC hybrid build, which is one validation run), with dependencies already installed, retaining generated files and compiler/build caches. Times include pnpm startup and all script steps. These are exploratory wall-clock observations, not controlled performance claims: baseline project installs/builds/checks overlapped and shared CPU; caches were not reset. Re-run serially on an idle machine before drawing a performance conclusion. Memory is not compared because the harness records cumulative child high-water marks. No browser runtime or editor latency was measured.

| Command / variant         | Seconds (all recorded runs) | Median seconds | Exit codes |
| ------------------------- | --------------------------- | -------------- | ---------- |
| shadcn-baseline-build-cli | 7.803, 8.238, 8.831         | 8.238          | 0, 0, 0    |
| shadcn-baseline-check     | 46.578, 59.454, 57.733      | 57.733         | 0, 0, 0    |
| shadcn-beta-build-cli     | 0.329, 0.361, 0.338         | 0.338          | 1, 1, 1    |
| shadcn-beta-check         | 1.234, 0.133, 0.107         | 0.133          | 1, 1, 1    |
| shadcn-hybrid-build-cli   | 7.457, 7.405, 7.709         | 7.457          | 0, 0, 0    |
| shadcn-hybrid-check       | 22.47, 22.951, 21.038       | 22.470         | 1, 1, 1    |

## Compatibility and interpretation

Upstream uses TypeScript 6.0.3 via the workspace catalog, with docs separately on 5.9.3. The final setup retains TypeScript 6 in the catalog for tooling, moves docs onto that catalog, and installs the beta as `@typescript/native`. Docs and primitives use `svelte-check --tsgo`; plain TypeScript package checks and declaration builds still use TypeScript 6. This is a native Svelte-check trial, not a complete removal of TypeScript 6. Baseline full checks pass with 0 errors and 0 warnings.

## Reproduction

Use the Node and pnpm versions above. On each revision, run `pnpm install --frozen-lockfile`, then run each measured command three times, recording wall time and exit status. BPC commands: `pnpm check`, `pnpm build`. shadcn-svelte commands: `pnpm check`, `pnpm build:cli` (package builds, not the full documentation website build). A failed check is a compatibility result and must not be interpreted as a speedup.

## Findings

Direct replacement (`beta` rows) fails installation/postinstall in the CLI build with `Cannot read properties of undefined (reading 'useCaseSensitiveFileNames')`. After linking with `pnpm install --frozen-lockfile --ignore-scripts`, svelte-check explicitly rejects TypeScript 7 as its only API dependency and recommends TypeScript 6 plus the native alias and `--tsgo`. Failed startup times must not be interpreted as performance gains.

The final supported dual-install setup is labelled `hybrid`. Native checks pass for primitives, but docs report 139 errors and 0 warnings in 79 files, compared with 0 errors at baseline. Most errors are implicit-any callback/snippet parameters; there are also unused `@ts-expect-error` directives. Example: `docs/src/routes/(app)/(layout)/examples/dashboard/components/data-table.svelte` reports implicit-any `row`, `col`, `e`, and an unused expect-error. This could reflect compiler or Svelte transform differences and has not been attributed to a compiler bug. No strictness settings or diagnostics were suppressed. The full-check elapsed-time change is not an equivalent successful-workload speedup. Keep this draft blocked on diagnostics parity.

Raw wall times and exit codes are recorded in `typescript-7.1-beta-results.json`. `baseline` is the original revision, `beta` is the rejected direct replacement, and `hybrid` is the final TypeScript 6 API plus 7.1 beta checker setup.

All three hybrid checks consistently report the same 139 errors. The full-check median falls from 57.733 to 22.470 s (61.1% less elapsed time), but diagnostic differences make this an invalid parity speedup claim. Package-build median is 7.457 s versus 8.238 s (9.5% less); these builds still use TypeScript 6 for API/declaration work, so this is noise-sensitive validation rather than evidence of faster TypeScript 7 builds. The full docs website build was not measured.
