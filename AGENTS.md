# AGENTS.md

## Commands

- Setup: `pnpm install`, then `pnpm exec playwright install --with-deps chromium webkit`.
- `pnpm dev`: the hub with reload, plus the dashboard on Vite with the hub's API and live socket proxied to it.
- `pnpm dev:site`: the landing page on Vite.
- `pnpm check`: Biome, typecheck, unit tests, e2e. Run it before every pull request. `pnpm lint` also runs knip and `pnpm build` makes `dist/`.
- `pnpm test` fails below 100% branches on `src/**/*-logic.ts` and `src/flows/flow-schema.ts`.
- `pnpm test:e2e` runs `e2e/*.e2e.ts` one file at a time, because one hub owns one port.
- Tests that start browsers or servers use port 0 on 127.0.0.1, never 4100.

## Recipes

### Add a device preset

1. Add it to `DEVICE_PRESETS` in `src/devices/device-presets.ts`, starting from Playwright's `devices` entry when one exists.
2. Set its `frameShape` and `cpuSlowdown` from `CPU_TIERS`.
3. Add its row to the README Devices table.

### Add a check

1. Add the kind to `FindingKind` in `src/checks/checks-logic.ts`.
2. Read what it needs in `measurePage` in `src/checks/check-probes.ts`.
3. Add the rule to `listFindings`, with a test for every branch.
4. Add its text to `src/dashboard/en.json` and its row to the README Checks table.

### Add a command

1. Add its schema to `src/commands/commands-schema.ts` and to `hubCommandSchema`.
2. Run it on each device page in `src/commands/commands-routes.ts`.
3. Add its CLI entry to `src/cli/cli-commands.ts`.
4. Add it to `src/skill/SKILL.md` and the README Commands table.

## Release

- First release, once, by hand: `pnpm check`, then `pnpm publish --access public` (npm asks for the one-time password), then `npm trust github everyscreen --file publish.yml --repo YosefHayim/everyscreen --allow-publish`.
- Every later release: bump `version` in `package.json` in a pull request, merge it, then `git tag vX.Y.Z` and `git push origin vX.Y.Z`. `publish.yml` publishes to npm with provenance.
- The site deploys from `site.yml` on every push to main that changes `src/site/` or `src/dashboard/ui/`.
