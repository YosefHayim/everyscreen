# Language

Every name in the code, the CLI, the dashboard and the docs uses these words. A variable holds what its term says, nothing wider.

**Hub**: the local process that `start` runs. It opens the browsers and answers every command.
_Avoid_: server, daemon, backend

**Device**: one browser viewport with a width, height and pixel ratio, identified by a device id.
_Avoid_: screen, phone, viewport

**Catalog device**: one of the 60 devices the hub knows, built in or added by us.
_Avoid_: model, built-in device

**Grid**: the devices a command runs on when you do not name one. It is 12 by default, set in `everyscreen.yaml`.
_Avoid_: default devices, device list

**Custom device**: a device you add to `everyscreen.yaml` with `devices add`.
_Avoid_: own device, user device

**Command**: one action sent to the hub, such as `open` or `tap`.
_Avoid_: request, call

**Reply**: the one line, or the one JSON object, that a command returns.
_Avoid_: response, output

**Step**: one action or check recorded in a run.
_Avoid_: action, event

**Run**: the record of one sweep, flow or group of commands. It has an id like `run-0001`.
_Avoid_: session, job

**Check**: one of the six built-in measurements of a page: `overflow`, `clipped-text`, `safe-area`, `tap-target`, `console-error` and `failed-request`.
_Avoid_: lint, audit

**Finding**: one problem a check reports on a page for one device.
_Avoid_: issue, warning, violation

**Failure**: a device that failed a command, with its message and shot path.
_Avoid_: error, miss

**Shot**: one screenshot of one device, saved under `.everyscreen/shots/`.
_Avoid_: snapshot, image

**Flow**: a YAML file in `flows/` that lists steps and devices, played by `run`.
_Avoid_: test, script, scenario

**Sweep**: the command that visits the routes of one url and shots every device on each route.
_Avoid_: crawl, scan

**Route**: a path of your app that a sweep visits, found from links or listed in `everyscreen.yaml`.
_Avoid_: link, page

**Skill**: the `SKILL.md` file that teaches a coding agent the commands.
_Avoid_: plugin, prompt

**Agent**: the coding tool a skill is installed for: `claude`, `codex` or `cursor`.
_Avoid_: assistant, bot

**Dashboard**: the web pages the hub serves at its address, with the grid, runs and devices.
_Avoid_: UI, frontend, admin

## Swaps

| Avoid                        | Use       |
| ---------------------------- | --------- |
| server, daemon               | hub       |
| screen, phone, viewport      | device    |
| default devices, device list | grid      |
| request, call                | command   |
| response, output             | reply     |
| session, job                 | run       |
| issue, warning, violation    | finding   |
| error, miss                  | failure   |
| snapshot, image              | shot      |
| test, script, scenario       | flow      |
| crawl, scan                  | sweep     |
| link, page                   | route     |
| plugin, prompt               | skill     |
| assistant, bot               | agent     |
| UI, frontend                 | dashboard |
