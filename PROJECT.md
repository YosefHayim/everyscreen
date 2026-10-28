# Project

## Problem

Checking a web app on every screen size is slow by hand: open devtools, pick a device, reload, scroll, then do it again for the next size. Coding agents have it worse. Each screenshot costs a lot of context, so an agent checks one or two sizes and misses the rest.

## Who

- Developers who build responsive web apps (React, Next.js, Vue, Svelte, Expo web) and want to see every size at once.
- Coding agents (Claude Code, Codex, Cursor) that change UI and need a cheap yes or no for each device.

## Insight

An agent does not need to see a screen to know it broke. A yes or no per device, with proof only when a step fails, costs a few lines of context instead of one picture per device. People still want to watch, so the same run streams to a live grid.

## Goals

- Every device at its true viewport, live, in one grid.
- One reply line per command, and a shot path only when a step fails.
- The user's own Playwright suites run on every device with no change to the tests.
- Six checks that catch the common mobile breakages.
- Proof for every failed step: the shot, the error message and the failing code block.
- Local first: one `npx` command, nothing installed in the app under test.

## Non-goals

- Native iOS and Android apps. Everyscreen tests the web build only.
- Real phone performance. Estimates come from Chromium with CPU throttling and always say "est.".
- A Safari replacement. WebKit is close to Safari, but it is not Safari.
- Visual diffs against saved baselines.
- A hosted service in v1.

## Direction

- v1: the CLI, the hub, the dashboard, YAML flows, the Playwright projects and reporter, the agent skill, one npm package.
- Next: Everyscreen Cloud runs the grid on every pull request in its own environment and posts a live preview link and the proof on the pull request.

## Principles

- Lines, not pictures, for agents.
- Honest numbers: every estimate is labeled.
- Zero setup in the app under test.
- Playwright underneath, so a device and a test mean what they mean in Playwright.
- Everything binds to 127.0.0.1.
