# Project

## Problem

A coding agent changes a web app and sees only one screen size. Layout breaks on a phone, a tablet or a small laptop go unseen until a person checks each size by hand.

## Who

Developers who build web apps with a coding agent and want the agent to check its own work on many screen sizes.

## Insight

One command that acts on every device at once, and one line back, is enough for an agent to decide what to fix next.

## Goals

- Run a web app in one browser per device, on a grid of common devices.
- Give each command one line, or one JSON object with `--json`.
- Find layout problems on each page after every action: overflow, clipped text, safe-area, tap targets, console errors and failed requests.
- Visit every route of an app with `sweep`, and play YAML flows with `run`.
- Let the developer add their own devices.

## Non-goals

- A hosted service. Everyscreen runs on the developer's machine and binds `127.0.0.1`.
- A replacement for Playwright tests. It exports the device list and a reporter for them.
- Testing every browser. The built-in catalog has Chromium and WebKit devices only.

## Direction

Keep one local hub, one browser per device and one line per command. Add devices and checks through the recipes in AGENTS.md, so every change follows the same path.

## Principles

- Replies are short and plain, so an agent can read them without help.
- Every command runs on every device unless the developer names one.
- A finding fails the command that found it.
- Everything runs on the developer's machine.
