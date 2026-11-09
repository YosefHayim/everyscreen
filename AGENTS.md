# AGENTS.md

## Commands

- Setup: `pnpm install`, then `pnpm exec playwright install --with-deps chromium webkit`.
- `pnpm dev`: the hub with reload, plus the Vite dashboard with `/api` proxied to the hub.
- `pnpm dev:site`: the site locally.
- `pnpm build`: the package build (tsdown, then the Vite dashboard).
- `pnpm lint` (Biome, then knip), `pnpm lint:fix`, `pnpm typecheck`.
- `pnpm test`: Vitest once. It fails below 100% branches on `src/**/*-logic.ts` and `src/flows/flow-schema.ts`.
- `pnpm test:e2e`: runs `e2e/*.e2e.ts` one at a time, because one hub listens on one port. Tests use port 0 on `127.0.0.1`.
- `pnpm check`: lint, typecheck, test, test:e2e, build and build:site, through Turborepo.

## Recipes

### Add a catalog device

1. Add the device to `src/devices/registry-devices.ts` (or `src/devices/own-devices.ts` for devices we design ourselves).
2. Take its `frameShape` and `cpuSlowdown` from `CPU_TIERS` in `src/environment.ts`.
3. Only if it belongs in the default grid, add its id to `src/devices/default-grid-ids.ts`. The grid holds 12.
4. Update the Devices section of `README.md` when the grid changes.

### Add a check

1. Add the kind to `FindingKind` in `src/checks/checks-logic.ts`, with its `listFindings` rule.
2. Measure the page in `measurePage` in `src/checks/check-probes.ts`.
3. Add the dashboard label to `src/dashboard/en.json`.
4. Update the Checks section of `README.md`.

### Add a command

1. Add the request shape to `hubCommandSchema` in `src/commands/commands-schema.ts`, and the handler in `src/commands/commands-routes.ts`.
2. Add the name to `CLI_COMMAND_NAMES` and the help text to `COMMAND_HELPS` in `src/cli/cli-help-pages.ts`.
3. Add its flags in `src/cli/cli-flags.ts` and its plan in `src/cli/cli-logic.ts`.
4. Update `src/skill/SKILL.md` and the Commands table in `README.md`.

## Release

The very first npm publish is manual: `npm publish --access public`, then `npm trust github everyscreen --file publish.yml --repository YosefHayim/everyscreen --allow-publish`. After that, tags publish through `publish.yml`.

1. Bump `version` in `package.json` in a pull request.
2. After it merges, tag the commit: `git tag v0.1.0` and `git push origin v0.1.0`.
3. `.github/workflows/publish.yml` runs on tags `v*.*.*`. It sets the version from the tag, runs typecheck, test and build, then publishes with provenance.
4. Deploy the site by hand with `pnpm deploy:site`. No workflow does it.
