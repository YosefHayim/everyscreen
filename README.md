# Everyscreen

See every screen while your agent tests it.

[![npm version](https://img.shields.io/npm/v/everyscreen)](https://www.npmjs.com/package/everyscreen)
[![license](https://img.shields.io/github/license/YosefHayim/everyscreen)](LICENSE)
[![CI](https://github.com/YosefHayim/everyscreen/actions/workflows/ci.yml/badge.svg)](https://github.com/YosefHayim/everyscreen/actions/workflows/ci.yml)

Everyscreen is a local CLI and live dashboard. It runs your web app on many device sizes at once, checks each screen for layout problems, and answers every command with one short line, so a coding agent can test every size without filling its context with screenshots. It is built on [Playwright](https://playwright.dev) and runs on your machine.

```text
$ everyscreen tap --role button --name "Add to cart"
5 devices · 4 ok · 1 failed · report run-0412
iphone-se  fail  cookie bar covers "Add to cart"  412 ms
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

The dashboard opens at `http://127.0.0.1:4100` and shows every device live.

## Use it with your app

Everyscreen opens a URL, so it works with any web stack. Nothing is installed in your app.

| Your app                                                                                        | Start it               | Then                                           |
| ----------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------- |
| [React](https://react.dev) with [Vite](https://vite.dev)                                        | `pnpm dev`             | `everyscreen open --url http://localhost:5173` |
| [Next.js](https://nextjs.org)                                                                   | `pnpm dev`             | `everyscreen open --url http://localhost:3000` |
| [Expo](https://expo.dev) or [React Native for Web](https://necolas.github.io/react-native-web/) | `npx expo start --web` | `everyscreen open --url http://localhost:8081` |
| Any other site                                                                                  | its dev server         | `everyscreen open --url <its url>`             |

### Your Playwright tests

Add two lines to `playwright.config.ts`. Your tests stay as they are. Each device becomes one Playwright project, and its pages show up live in the grid.

```ts
import { defineConfig } from "@playwright/test";
import { listDevices } from "everyscreen/playwright";

export default defineConfig({
  projects: listDevices(["iphone-se", "pixel-8", "ipad-mini"]),
  reporter: [["list"], ["everyscreen/reporter"]],
});
```

```sh
npx everyscreen start
npx playwright test
```

A failed test shows its shot, error message and failing code block in the run report.

### YAML flows

No tests yet? Write a flow:

```yaml
# flows/checkout.yaml
name: Checkout with a coupon
devices: [iphone-se, iphone-15, pixel-8]
steps:
  - open: http://localhost:5173
  - fill: { role: textbox, name: Coupon, with: SPRING }
  - tap: { role: button, name: Apply }
  - expect: { text: "Total $66" }
```

```sh
npx everyscreen run --flows "flows/*.yaml" --parallel 4
```

## Use it with your agent

```sh
npx everyscreen skill install
```

This writes the Everyscreen skill where [Claude Code](https://code.claude.com/docs/en/skills), [Codex](https://developers.openai.com/codex/skills) and [Cursor](https://cursor.com/docs/context/skills) read skills. The agent then starts the hub, runs commands, and reads one line per command. A shot path comes back only when a step fails.

## Commands

| Command                                                                             | What it does                                                   |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `everyscreen start`                                                                 | Starts the hub on `127.0.0.1:4100`.                            |
| `everyscreen stop`                                                                  | Stops the hub and closes every device browser.                 |
| `everyscreen open --url <url>`                                                      | Opens the app on every device.                                 |
| `everyscreen tap --role button --name "Apply"`                                      | Taps on every device. Add `--device iphone-se` for one device. |
| `everyscreen fill --role textbox --name Coupon --with SPRING`                       | Types into a field on every device.                            |
| `everyscreen scroll --to bottom`                                                    | Scrolls every device.                                          |
| `everyscreen check`                                                                 | Runs the six checks now.                                       |
| `everyscreen shot --device iphone-se`                                               | Saves a shot and prints its path.                              |
| `everyscreen run --flows "flows/*.yaml" --parallel 4`                               | Runs YAML flows, four at a time.                               |
| `everyscreen report --run run-0412`                                                 | Prints a run report.                                           |
| `everyscreen device add --name "Checkout tablet" --width 800 --height 1280 --touch` | Adds a device to the grid.                                     |
| `everyscreen device list`                                                           | Lists every device.                                            |

Every command takes `--json` and then prints one JSON object. Exit codes: `0` ok, `1` failed, `2` bad usage.

## Devices

| Id                  | Name              | Viewport  |
| ------------------- | ----------------- | --------- |
| `iphone-se`         | iPhone SE         | 375x667   |
| `iphone-15`         | iPhone 15         | 393x852   |
| `iphone-15-pro-max` | iPhone 15 Pro Max | 430x932   |
| `galaxy-s24`        | Galaxy S24        | 360x780   |
| `pixel-8`           | Pixel 8           | 412x915   |
| `ipad-mini`         | iPad mini         | 744x1133  |
| `ipad-pro-11`       | iPad Pro 11       | 834x1194  |
| `laptop-1440`       | Laptop 1440       | 1440x900  |
| `store-kiosk`       | Store kiosk       | 1080x1920 |

Add your own with `everyscreen device add`, or in `everyscreen.yaml` at your project root:

```yaml
devices:
  - name: Checkout tablet
    width: 800
    height: 1280
    pixelRatio: 2
    hasTouch: true
```

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
- iPhone and iPad devices run in [WebKit](https://webkit.org), the rest in Chromium. WebKit has no live video: those tiles update with one picture after each step, not as a stream.
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
