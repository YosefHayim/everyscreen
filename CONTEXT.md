# Context

Everyscreen is a local dev tool in one npm package: a CLI, a hub and a dashboard. The hub runs a web app in one browser per device, streams every screen to a grid, runs six checks, and answers each command with one line.

## Actors

- **Developer**: starts the hub, watches the grid, adds devices, reads reports.
- **Agent**: drives the hub through the CLI after `everyscreen skill install`, reads reply lines, opens a shot only when a step fails.
- **Suite**: the user's Playwright tests, one Playwright project per device, each connected to that device's browser.
- **App under test**: any web app on a URL, usually the dev server. Nothing is installed in it.

## Shape

```
CLI ── hc<HubApp> over HTTP ──► Hub (Hono, 127.0.0.1:4100)
                                 ├─ device browsers: one per device, WebKit for iPhone and iPad, Chromium for the rest (launchServer)
                                 │   └─ page watchers: screencast, estimates and console errors over CDP on Chromium;
                                 │      one screen image per step on WebKit
                                 ├─ runs store: .everyscreen/runs, .everyscreen/shots
                                 ├─ live feed ── WebSocket /api/live ──► Dashboard (React, served by the hub)
                                 └─ hub file: .everyscreen/hub.json
playwright.config.ts ── listDevices() reads the hub file ──► device browsers
Playwright reporter ── POST /api/runs/:runId/events ──► Hub
```

## One command

1. `everyscreen tap --role button --name Apply` posts one command to `/api/commands`.
2. The hub runs it on each chosen device's page, one command at a time.
3. Each device gives a device answer, and the checks add findings.
4. The hub saves the step into the run and sends back the reply.
5. The CLI prints the line (or one JSON object) and sets the exit code.

## Files

- `everyscreen.yaml`: the user's custom devices and grid list, committed in their repo.
- `.everyscreen/`: the hub file, runs and shots, git-ignored.
- `src/skill/SKILL.md`: what `everyscreen skill install` writes for agents.
- `src/site/`: the landing page on everyscreen.jtslabs.dev, built from the dashboard's UI kit.
