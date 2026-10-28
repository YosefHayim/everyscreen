# Language

Every name in the code, the CLI, the dashboard and the docs uses these words. A variable holds what its term says, nothing wider.

**Device**
One screen size the app runs on, such as `iphone-se`: an id, a name, a viewport, a pixel ratio, touch, a frame shape and a CPU slowdown.
_Avoid_: screen, target, emulator, profile

**Device catalog**
The 59 devices Everyscreen can run, from Playwright's registry and its own list. The grid starts 12 of them by default.
_Avoid_: device list, device library, presets, built-in devices

**Custom device**
A device the user adds in `everyscreen.yaml` or with `devices add`.
_Avoid_: user device, extra device, own device

**Frame**
The outline drawn around a device's screen, picked by its frame shape: home button, dynamic island, punch hole, tablet, laptop, kiosk.
_Avoid_: bezel, skin, shell, mockup

**Screen image**
The latest live picture of one device's screen, sent as a JPEG in the live feed.
_Avoid_: frame (for the picture), snapshot, capture, image

**Grid**
The dashboard view that shows every device at once.
_Avoid_: wall, board, matrix, gallery

**Tile**
One device inside the grid: its frame, screen image, status chip and estimates.
_Avoid_: card, cell, panel

**Hub**
The local server on 127.0.0.1:4100 that owns the device browsers, the API, the live feed and the dashboard.
_Avoid_: server, daemon, backend, host

**Device browser**
The one browser the hub starts for one device. Every page in it belongs to that device.
_Avoid_: instance, worker, session

**Hub file**
`.everyscreen/hub.json`, where the hub writes each device browser's endpoints.
_Avoid_: lock file, state file, registry

**Command**
One action the CLI or a flow sends to the hub: open, tap, fill, scroll, check, shot, expect.
_Avoid_: action, operation, instruction, request

**Reply**
What the CLI prints for one command: one line, or one JSON object with `--json`.
_Avoid_: output, result, response, message

**Run**
One agent session, one flow, or one Playwright suite run, saved as `.everyscreen/runs/run-0412.json`.
_Avoid_: session, job, execution, test run

**Step**
One command inside a run, with one device answer per device.
_Avoid_: action, event, stage

**Device answer**
How one device did on one step: ok or failed, and how long it took.
_Avoid_: result, outcome, response, status (for the whole object)

**Run event**
What the Playwright reporter sends the hub: run start, step end, run end.
_Avoid_: message, update, notification

**Check**
One of the six page rules: past the screen edge, clipped text, under the notch or home bar, small tap target, console error, failed request.
_Avoid_: rule, test, audit, lint, assertion

**Measurements**
The plain boxes and sizes the check probes read from a page.
_Avoid_: metrics, stats, snapshot, dump

**Finding**
One problem a check found on one device. It pops a toast and goes into the report.
_Avoid_: issue, error, warning, violation, problem

**Proof**
What a failed step keeps: the shot, the error message and the failing code block.
_Avoid_: evidence, artifact, attachment (outside Playwright's own API)

**Shot**
One device's screenshot, saved under `.everyscreen/shots/`.
_Avoid_: screenshot (in names), capture, picture

**Report**
The page and the file that show one run: steps, device answers, findings and proof.
_Avoid_: summary, results page, log

**Sample**
One reading of a page's performance counters.
_Avoid_: metric, tick, measurement

**Estimate**
The fps, CPU, memory and layout shift of a device, made from samples and always labeled "est.".
_Avoid_: metric, benchmark, score, performance

**Device load**
One device's estimate at one moment, with an ok or warn status.
_Avoid_: stats, perf, health

**Status**
How something went, in one word set: ok, warn or failed. Device answers, device loads, findings and tile chips all use it.
_Avoid_: pass, fail, success, error

**Route**
One path of the app under test, such as `/pricing`, that a sweep visits.
_Avoid_: page, url, screen, view

**Sweep**
One run that visits every route of the app on every chosen device and saves a shot of each.
_Avoid_: crawl, scan, audit

**Flow**
A YAML file of steps that runs on a list of devices.
_Avoid_: scenario, script, spec, journey, test

**Suite**
The user's own Playwright tests, run through Everyscreen without changes.
_Avoid_: spec set, test files, project (Playwright's own word for one device)

**Live feed**
The WebSocket stream from the hub to the dashboard: screen images, findings, estimates and run updates.
_Avoid_: stream, socket, events, channel

**Skill**
The agent instruction file that `everyscreen skill install` writes.
_Avoid_: plugin, prompt, rules file

**Agent**
A coding agent (Claude Code, Codex, Cursor) that drives Everyscreen from the CLI.
_Avoid_: bot, AI, assistant, LLM

## Swaps

| Avoid                     | Use                           |
| ------------------------- | ----------------------------- |
| result, outcome, response | device answer, reply          |
| issue, violation, warning | finding                       |
| scenario, script, journey | flow                          |
| session, job, test run    | run                           |
| screenshot, capture       | shot                          |
| metric, stats, perf       | sample, estimate, device load |
| bezel, skin               | frame                         |
| frame (the picture)       | screen image                  |
| server, daemon            | hub                           |
| card, cell                | tile                          |
| action, request           | command                       |
| output                    | reply                         |
| pass, fail, success       | ok, failed                    |
| crawl, scan               | sweep                         |
| page, url (of the app)    | route                         |
