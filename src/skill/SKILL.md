---

name: everyscreen
description: Check a web app on many device sizes at once with the Everyscreen CLI. Use when the user asks to test a page on phones, tablets or other screen sizes, or to find layout bugs.
---

# Everyscreen

Everyscreen runs your web app on many devices at once and tells you in one line per device what happened.

1. Start the hub with `npx everyscreen start`.
2. Add `--json` to every command.
3. Read one reply line per device. Do not open shots unless a step fails.
4. When a step fails, open the report with `everyscreen report --run <run id>`.
