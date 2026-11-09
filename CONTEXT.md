# Context

Everyscreen is one npm package with three parts: a CLI, a hub and a dashboard. It runs a web app in one browser per device, so a coding agent can act on every screen size at once.

## Actors

- **Coding agent**: runs the CLI commands, reads each one-line reply, and uses the skill.
- **Developer**: starts the hub, adds custom devices, writes flows, and reads the dashboard.
- **Your app**: the web app under test, served on its own port, for example `localhost:3000`.
- **Device browsers**: one Chromium or WebKit browser per device, started by the hub.

## Shape

- `src/cli/`: the `everyscreen` command. It reads the flags, sends one request to the hub, and prints one line or one JSON object.
- `src/commands/`: the command schema and the hub routes that act on every device.
- `src/devices/`: the catalog, the grid, custom devices and the device browsers.
- `src/checks/`: the built-in checks that measure each page after a command acts.
- `src/sweep/` and `src/flows/`: the runs that visit many routes or follow many steps.
- `src/dashboard/`: the web pages the hub serves: the grid, runs and devices.
- `src/playwright/`: the device list and reporter for your own Playwright tests.
- `src/skill/`: the skill file and the installer for each coding agent.

## One command

`everyscreen open --url <url>` reaches the CLI, which sends the command to the hub. The hub opens the url on every device, runs the checks on each page, records the step in the current run, and sends back one reply. The CLI prints that reply and sets the exit code.

## Files in your app

- `.everyscreen/`: the hub state (`hub.json`, `hub.log`, `runs/`, `shots/`).
- `everyscreen.yaml`: custom devices, routes and the grid.
- `flows/*.yaml`: the flows that `run` plays.
- `.claude/`, `.agents/` or `.cursor/` `skills/everyscreen/SKILL.md`: the skill, after `skill install`.
