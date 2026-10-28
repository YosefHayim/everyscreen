# AGENTS.md

## Commands

- Setup: `pnpm install`, then `pnpm exec playwright install --with-deps chromium webkit`.
- `pnpm dev`: the hub with reload, plus the dashboard on Vite with the hub's API and live socket proxied to it.
- `pnpm dev:site`: the landing page on Vite.
- `pnpm check`: lint (Biome and knip), typecheck, unit tests, e2e, `pnpm build` and `pnpm build:site`. Run it before every pull request.
- `pnpm test` fails below 100% branches on `src/**/*-logic.ts` and `src/flows/flow-schema.ts`.
- `pnpm test:e2e` runs `e2e/*.e2e.ts` one file at a time, because one hub owns one port.
- Tests that start browsers or servers use port 0 on 127.0.0.1, never 4100.

## Recipes

### Add a catalog device

1. Playwright's registry covers most devices (`src/devices/registry-devices.ts`). For one it lacks, add it to `src/devices/own-devices.ts` with a source comment for its size.
2. Set its `frameShape` and `cpuSlowdown` from `CPU_TIERS`.
3. To put it in the default grid, add its id to `src/devices/default-grid-ids.ts` (12 at most) and its row to the README Devices table.

### Add a check

1. Add the kind to `FindingKind` in `src/checks/checks-logic.ts`.
2. Read what it needs in `measurePage` in `src/checks/check-probes.ts`.
3. Add the rule to `listFindings`, with a test for every branch.
4. Add its text to `src/dashboard/en.json` and its row to the README Checks table.

### Add a command

1. Add its schema to `src/commands/commands-schema.ts` and to `hubCommandSchema`.
2. Run it on each device page in `src/commands/commands-routes.ts`.
3. Add its name and help page to `CLI_COMMAND_NAMES` and `COMMAND_HELPS` in `src/cli/cli-help-pages.ts`, and its flags to `src/cli/cli-flags.ts` and `src/cli/cli-logic.ts`.
4. Add it to `src/skill/SKILL.md` and the README Commands table.

## Release

- Bump `version` in `package.json` in a pull request and merge it.
- Push a tag: `git tag v0.1.0` then `git push origin v0.1.0`. `publish.yml` runs on the tag and publishes to npm with provenance.
- The site deploys by hand from your machine: `pnpm deploy:site` builds it and runs `wrangler deploy`. There is no GitHub workflow for it.
