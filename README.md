# Everyscreen

See every screen while your agent tests it.

[![npm version](https://img.shields.io/npm/v/everyscreen)](https://www.npmjs.com/package/everyscreen)
[![license](https://img.shields.io/github/license/YosefHayim/everyscreen)](LICENSE)
[![CI](https://github.com/YosefHayim/everyscreen/actions/workflows/ci.yml/badge.svg)](https://github.com/YosefHayim/everyscreen/actions/workflows/ci.yml)

Everyscreen is a local CLI and live dashboard. It runs your web app on many device sizes at once, checks each screen for layout problems, and answers every command with one short line, so a coding agent can test every size without filling its context with screenshots. It is built on [Playwright](https://playwright.dev) and runs on your machine.

```text
$ everyscreen tap --role button --name "Add to cart"
5 devices · 4 ok · 1 failed · report run-0412
iphone-se  failed  cookie bar covers "Add to cart"  412 ms
```

## Install

Everyscreen needs [Node.js](https://nodejs.org) 22.17 or later.

```sh
npm install --save-dev everyscreen
npx playwright install chromium webkit
```

Or run it once with `npx everyscreen`, without installing it.

## Quick start

Start your app's dev server as usual, then:

```sh
npx everyscreen start
npx everyscreen open --url http://localhost:5173
npx everyscreen check
```

The dashboard is at `http://127.0.0.1:4100` and shows every device live.

## Use it with your app

Everyscreen opens a URL, so it works with any web stack. Nothing is installed in your app.

| Your app                                                                                        | Start it               | Then                                           |
| ----------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------- |
| [React](https://react.dev) with [Vite](https://vite.dev)                                        | `pnpm dev`             | `everyscreen open --url http://localhost:5173` |
| [Next.js](https://nextjs.org)                                                                   | `pnpm dev`             | `everyscreen open --url http://localhost:3000` |
| [Expo](https://expo.dev) or [React Native for Web](https://necolas.github.io/react-native-web/) | `npx expo start --web` | `everyscreen open --url http://localhost:8081` |
| Any other site                                                                                  | its dev server         | `everyscreen open --url <its url>`             |

### Your Playwright tests

Add two lines to `playwright.config.ts`. Your tests stay as they are. Each device becomes one [Playwright project](https://playwright.dev/docs/test-projects), and its pages show up live in the grid.

```ts
import { defineConfig } from "@playwright/test";
import { listDevices } from "everyscreen/playwright";

export default defineConfig({
  projects: listDevices(["iphone-se", "pixel-10", "ipad-mini"]),
  reporter: [["list"], ["everyscreen/reporter"]],
});
```

`listDevices()` with no ids returns every device in your grid. To watch each page live, import `test` and `expect` from `everyscreen/test` instead of `@playwright/test`. It is the same Playwright test, with the page's screen images sent to the hub.

```ts
import { expect, test } from "everyscreen/test";

test("shows the cart total", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await expect(page.getByText("Total")).toBeVisible();
});
```

```sh
npx everyscreen start
npx playwright test
```

#### Live tests on every device

The reporter sends each test and step to the hub, so every device tile shows its own test steps while they run. Above the grid, the run bar shows the totals: done, ok, failed, running and elapsed time.

Playwright runs projects in [parallel workers](https://playwright.dev/docs/test-parallel). The default is half of your CPU cores, so a long device list can wait in a queue. To run every device at once, set `workers` to the number of devices:

```ts
const projects = listDevices(["iphone-se", "pixel-10", "ipad-mini"]);

export default defineConfig({
  projects,
  workers: projects.length,
  reporter: [["list"], ["everyscreen/reporter"]],
});
```

A failed test shows its shot, error message and failing code block in the run report. When the run ends, the reporter prints the same one-line reply as the CLI.

### YAML flows

No tests yet? Write a flow:

```yaml
# flows/checkout.yaml
name: Checkout with a coupon
devices: [iphone-se, iphone-17, pixel-10]
steps:
  - open: http://localhost:5173
  - fill: { role: textbox, name: Coupon, with: SPRING }
  - tap: { role: button, name: Apply }
  - expect: { text: "Total $66" }
```

```sh
npx everyscreen run --flows "flows/*.yaml" --parallel 4
```

### Sweep every route

`sweep` visits every route of your app on every device and saves a shot of each. It finds routes by following the links on each page, reading `/sitemap.xml`, and adding the `routes:` list from `everyscreen.yaml`.

```sh
npx everyscreen sweep --url http://localhost:5173
```

```text
1 route · 2 devices · 2 shots · 6 findings · 2 failed · report run-0002
iphone-se  failed  / div.cart-total:nth-of-type(3) is 121px past the edge  48 ms
pixel-10  failed  / div.cart-total:nth-of-type(3) is 136px past the edge  63 ms
```

- `--devices <id,id,...>` picks devices. `--devices all` sweeps the whole catalog. The grid stays as it is, and at most 4 extra devices run at the same time.
- `--max-routes <number>` limits the routes. The default is 50, the most is 500.
- `--before <flow.yaml>` runs a flow first on each device, in the same browser context, so its cookies carry over. Use it to log in:

```sh
npx everyscreen sweep --url http://localhost:5173 --before flows/login.yaml
```

The dashboard shows the sweep as a matrix of routes by devices, with each cell's status and findings. Click a cell to open its shot in a dialog. It also has a Run sweep button.

## Use it with your agent

```sh
npx everyscreen skill install
```

This writes the Everyscreen skill where [Claude Code](https://code.claude.com/docs/en/skills), [Codex](https://developers.openai.com/codex/skills) and [Cursor](https://cursor.com/docs/context/skills) read skills. Pick the agent with `--agent claude|codex|cursor`. The agent then starts the hub, runs commands, and reads one line per command. A shot path comes back only when a step fails.

## Commands

| Command                                                                              | What it does                                                                                       |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `everyscreen start [--port <number>] [--foreground]`                                 | Starts the hub and one browser per device, in the background. The port defaults to 4100.           |
| `everyscreen stop`                                                                   | Stops the hub and closes every device browser.                                                     |
| `everyscreen status`                                                                 | Shows whether the hub is running and how many devices it has.                                      |
| `everyscreen open --url <url>`                                                       | Opens the app on every device.                                                                     |
| `everyscreen tap --role button --name "Apply"`                                       | Taps on every device. Add `--device iphone-se` for one device. Every page command takes it.        |
| `everyscreen fill --role textbox --name Coupon --with SPRING`                        | Types into a field on every device.                                                                |
| `everyscreen scroll --to bottom`                                                     | Scrolls every device to the top or the bottom.                                                     |
| `everyscreen check`                                                                  | Runs the six checks now.                                                                           |
| `everyscreen shot`                                                                   | Saves a shot of every device.                                                                      |
| `everyscreen expect --text "Total $66"`                                              | Checks that the text shows on every device.                                                        |
| `everyscreen sweep --url <url> [--devices <ids>\|all] [--max-routes n] [--before f]` | Visits every route on every device and saves a shot of each.                                       |
| `everyscreen run [--flows "flows/*.yaml"] [--parallel <number>]`                     | Runs YAML flows. The default is `flows/*.yaml`, one at a time.                                     |
| `everyscreen devices list`                                                           | Lists the devices in the grid.                                                                     |
| `everyscreen devices add --name "Checkout tablet" --width 800 --height 1280 --touch` | Adds a custom device to `everyscreen.yaml`. Takes `--pixel-ratio` too. Restart the hub to show it. |
| `everyscreen devices remove --device checkout-tablet`                                | Removes a custom device from `everyscreen.yaml`.                                                   |
| `everyscreen skill install [--agent claude\|codex\|cursor]`                          | Installs the agent skill. The default agent is `claude`.                                           |

Run `everyscreen --help` for the list, or `everyscreen <command> --help` for one command's flags.

Replies and exit codes:

- On a terminal, a command prints one line, plus one row per failed device. With `--json`, or when the output is piped, it prints one JSON object with `status`, `line`, `runId` and `failures`.
- Exit codes: `0` ok, `1` failed, `2` bad usage.
- `devices remove` and `skill install` change files. Without a terminal they need `--yes`, and fail with exit code 1 without it.

## Devices

Everyscreen ships a catalog of 59 devices: iPhone, Galaxy, Pixel, Xiaomi, OnePlus, iPad, Mac, Windows and Linux. The catalog comes from the [Playwright device registry](https://playwright.dev/docs/emulation#devices) plus newer models. `GET /api/devices/catalog` on the hub lists them all.

The grid starts 12 of them by default, one per size class and engine:

| Id                    | Name                | Viewport  |
| --------------------- | ------------------- | --------- |
| `iphone-se`           | iPhone SE           | 375x667   |
| `iphone-17`           | iPhone 17           | 402x874   |
| `iphone-17-pro-max`   | iPhone 17 Pro Max   | 440x956   |
| `galaxy-s25`          | Galaxy S25          | 360x780   |
| `pixel-10`            | Pixel 10            | 360x808   |
| `xiaomi-15`           | Xiaomi 15           | 400x890   |
| `ipad-mini`           | iPad mini           | 744x1133  |
| `ipad-pro-11`         | iPad Pro 11         | 834x1194  |
| `galaxy-tab-s9`       | Galaxy Tab S9       | 640x1024  |
| `macbook-air-13`      | MacBook Air 13      | 1470x956  |
| `windows-laptop-1366` | Windows laptop 1366 | 1366x768  |
| `linux-1920`          | Linux monitor 1920  | 1920x1080 |

Choose your own grid, add custom devices and set each device's viewport in `everyscreen.yaml` at your project root:

```yaml
grid: [iphone-se, pixel-10, ipad-mini, macbook-air-13]
viewportModes:
  iphone-17: browser
devices:
  - name: Checkout tablet
    width: 800
    height: 1280
    pixelRatio: 2
    hasTouch: true
routes: [/pricing, /account]
```

- `grid` lists the device ids to start. Any catalog id works, and so does a custom device's id.
- `viewportModes` sets a device to `full-screen` (the whole screen, the default) or `browser` (the smaller area left inside the browser). A device with no browser size keeps the full screen.
- `routes` adds routes for `sweep`.

The dashboard devices screen can add or remove a custom device too.

## Checks

| Check                       | What it finds                                             |
| --------------------------- | --------------------------------------------------------- |
| Past the screen edge        | Any element wider than the screen, and by how much.       |
| Clipped text                | Text cut off by its box.                                  |
| Under the notch or home bar | Text and buttons inside the safe-area insets.             |
| Small tap targets           | Buttons and links smaller than 44 by 44 on touch devices. |
| Console errors              | Errors and uncaught exceptions from the page.             |
| Failed requests             | Requests that fail or answer 4xx or 5xx.                  |

Console errors and failed requests are read on Chromium devices only. The other four checks run on every device.

Each finding pops a toast in the dashboard and goes into the run report.

## Estimates

Each Chromium device shows fps, CPU, memory and layout shift. They come from [Chromium](https://www.chromium.org) with CPU throttling per device, for example 2x slower on a phone. They are estimates, not readings from a real phone, so they say "est." everywhere. WebKit devices have no estimates.

## Scope

- Web apps only. A React Native app works through its web build (Expo web or React Native for Web). Native iOS and Android apps are out of scope; test those on simulators.
- Devices are emulated on your machine. They are not real phones.
- iPhone and iPad devices run in [WebKit](https://webkit.org), the rest in Chromium. WebKit has no live video: those tiles update with one picture after each step, not as a stream. Tests that import `everyscreen/test` send a picture about three times a second on every engine.
- Estimates are estimates, and only Chromium devices have them.

## Contributing

Everyscreen uses [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm exec playwright install --with-deps chromium webkit
pnpm dev
pnpm check
```

`pnpm check` runs Biome, typecheck, unit tests and e2e, the same as CI. [CONTEXT.md](CONTEXT.md) shows how the pieces fit, [LANGUAGE.md](LANGUAGE.md) names every term, and [AGENTS.md](AGENTS.md) has the recipes and release steps.

## License

[MIT](LICENSE)
