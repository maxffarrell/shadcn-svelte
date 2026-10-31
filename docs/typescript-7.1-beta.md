# TypeScript 7.1 beta migration experiment

Status: **blocked experimental migration; do not merge yet**. Candidate uses only `typescript@7.1.0-beta` in the workspace dependency graph. Baseline upstream is `fe4b0ad3b8b30c6745346db008c3307b5afeabb1`. Measurements: 2026-10-31.

## Final dependency setup

The workspace catalog pins TypeScript to `7.1.0-beta`; the former `@typescript/native` alias and TypeScript 6 fallback are removed. Docs use the same catalog as the other workspace packages. A TypeScript override prevents incompatible peer dependencies from silently installing TypeScript 5 or 6. This override deliberately does not imply those tools support TypeScript 7.

`tsdown` is upgraded from 0.22.14 to 0.23.4. Its declaration plugin is overridden to `rolldown-plugin-dts@0.29.0`, which recognizes the TypeScript 7.1 declaration API. The older plugin chooses the classic generator and crashes at `ts.sys.useCaseSensitiveFileNames`. The new combination successfully emits the CLI's JavaScript and `.d.mts` declarations using TypeScript 7.1.

`pnpm list -r typescript --depth Infinity --json` confirms that the final resolved graph contains only `7.1.0-beta`. No source strictness settings, diagnostics, declaration generation, or lint checks have been disabled. Incompatible peer warnings are expected. The standalone `repro` project and CLI test fixtures are outside the workspace compiler migration; their fixture manifests still describe older consumer projects.

## Successful performance comparison

Linux x86_64 cloud VM, 5 visible Intel Xeon Platinum 8573C CPUs, Node 24.22.1, pnpm 12.14.0. Three fresh processes per compiler, sequentially on the same CLI sources and dependency graph, with no concurrent benchmark/build jobs and no compiler-output cache reset. Command: `node <compiler>/bin/tsc --noEmit`, working directory `packages/cli`.

The TS6 reference compiler was retained on disk from the previous baseline installation solely for this A/B measurement. It is absent from the candidate dependency graph. Results exclude pnpm startup. The reference is TypeScript 6.0.3; the candidate is 7.1.0-beta.

| Command                                        | Seconds             | Median  | Result   |
| ---------------------------------------------- | ------------------- | ------- | -------- |
| Isolated CLI check, TS6                        | 2.620, 2.433, 2.463 | 2.463 s | All pass |
| Isolated CLI check, TS7.1                      | 0.459, 0.447, 0.462 | 0.459 s | All pass |
| CLI build, TS7.1 + updated declaration tooling | 0.981, 0.916, 0.968 | 0.968 s | All pass |

For the isolated CLI check, TS7.1 used **81.4% less elapsed time (about 5.37x faster)**. These are small-sample warm-filesystem observations on shared hardware, not guarantees. The build has no directly comparable isolated TS6 build baseline; the earlier full-package-build baseline measures a different command. Compiler/runtime versions and declaration tooling changed, so no whole-project or browser-runtime speedup is claimed. Memory was not compared.

## Validation and remaining blockers

| Validation                                        | Result                                                                                                                                                                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen install with `--ignore-scripts`            | Pass; manifest and lockfile agree                                                                                                                                                                                     |
| CLI `tsc --noEmit`                                | Pass                                                                                                                                                                                                                  |
| Parity, sv add-on, registry add-on `tsc --noEmit` | All pass                                                                                                                                                                                                              |
| CLI `tsdown --minify`, including declarations     | Pass, three measured runs                                                                                                                                                                                             |
| Full workspace `pnpm check`                       | Fails: svelte-check explicitly requires TypeScript 6 plus native TypeScript 7                                                                                                                                         |
| Primitives `svelte-package`                       | Fails: svelte2tsx `emitDts is not compatible with TypeScript 7.1.0-beta`                                                                                                                                              |
| Full package build `pnpm build:cli`               | Fails at primitives packaging; standalone CLI build passes                                                                                                                                                            |
| ESLint on CLI entry                               | Fails: typescript-eslint explicitly rejects TypeScript 7's API                                                                                                                                                        |
| CLI tests                                         | 259 passed, 8 failed in 2 files; failures concern proxy expectations under the inherited proxy environment. A matching baseline test run was not performed, so these are not claimed as proven pre-existing failures. |

The latest releases checked during this experiment still declare legacy API requirements: svelte-check 4.7.7 supports TypeScript 5/6, svelte2tsx 0.7.62 supports TypeScript 4.9/5/6, @sveltejs/package 3.0.2 requires TypeScript 6, and typescript-eslint 8.72.1 requires TypeScript below 6.1. Upgrading those packages therefore does not offer a supported TS7-only migration today. The branch retains the repository's existing Svelte and lint tool versions and exposes their failures. Completing the migration requires upstream support or a separately reviewed replacement of the Svelte checking, declaration-emission, and linting toolchain. Normal postinstall invokes the full build and remains blocked; installation currently requires `--ignore-scripts`.

The full docs website build was not measured in this final setup. Failed startup timings are compatibility observations, not speedups.

## Earlier experiments

The raw results file also retains earlier baseline/direct-replacement/dual-install observations for traceability. They are **not the final configuration**. The original full workspace check passed with zero errors and warnings, median 57.733 s. A dual-install experiment with `svelte-check --tsgo` took a median 22.470 s but reported 139 errors in 79 docs files; diagnostics parity was not achieved, so that difference was not counted as a speedup. The earlier measurements overlapped other installs/builds/checks and retained generated/compiler caches.

## Reproduction

1. Use Node 24.22.1 and pnpm 12.14.0.
2. Run `pnpm install --frozen-lockfile --ignore-scripts`.
3. Run `pnpm -F shadcn-svelte check` and `pnpm -F shadcn-svelte build` three times each.
4. Run `pnpm -r -F './packages/cli' -F './packages/parity' -F './sv-addons/*' check`.
5. Run `pnpm check`, `pnpm build:cli`, `pnpm -F @shadcn-svelte/primitives package`, and `pnpm exec eslint packages/cli/src/index.ts --no-config-lookup --config eslint.config.js` to reproduce the remaining blockers.
6. For the isolated check A/B, invoke the two exact compiler binaries directly against `packages/cli/tsconfig.json` from `packages/cli`, retaining the same sources and dependency graph. Install the TS6 reference compiler in a separate temporary directory rather than adding it to this workspace.

Raw wall times and exit codes, with distinct labels for each experiment, are recorded in `typescript-7.1-beta-results.json`.
