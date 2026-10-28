---
name: everyscreen
description: Check a web app on many device sizes at once with the Everyscreen CLI. Use when the user asks to test a page on phones, tablets or other screen sizes, or to find layout bugs.
---

# Everyscreen

Everyscreen runs your web app on many devices at once and answers each command with one line.

1. Start the hub with `npx everyscreen start`. The dashboard is at http://127.0.0.1:4100.
2. Add `--json` to every command. The reply is then one JSON object instead of the line.
3. Read the reply. Do not open shots unless a step fails.
4. When a step fails, read `failures` in the JSON reply. Each failed device has `deviceId`, `message` (the error, so read its first line) and `shotPath`. Open only the shots of the failed devices. For the full report, give the user `http://127.0.0.1:4100/runs/<runId>`, using `runId` from the reply.
5. To check every route of the app on every device, run `npx everyscreen sweep --url <url>`. Add `--before <flow.yaml>` to run a login flow first on each device.
6. To run the user's Playwright tests on every device at once, import `test` from `everyscreen/test` and use the `everyscreen/reporter` reporter. See the README.
