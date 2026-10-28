import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import type { SkillAgent } from "@/skill/skill-agents";
import { installSkill } from "@/skill/skill-install";

const SKILL_PATHS: Record<SkillAgent, string> = {
  claude: ".claude/skills/everyscreen/SKILL.md",
  codex: ".agents/skills/everyscreen/SKILL.md",
  cursor: ".cursor/skills/everyscreen/SKILL.md",
};
const AGENTS: SkillAgent[] = ["claude", "codex", "cursor"];

let rootFolder = "";

test.beforeEach(async () => {
  rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-skill-"));
});

test.afterEach(async () => {
  await rm(rootFolder, { recursive: true, force: true });
});

for (const agent of AGENTS) {
  test(`installs the skill where ${agent} reads it`, async () => {
    const installedFile = await installSkill(agent, rootFolder);
    const skillMarkdown = await readFile(installedFile, "utf8");

    expect(installedFile).toBe(join(rootFolder, SKILL_PATHS[agent]));
    expect(skillMarkdown).toContain("name: everyscreen");
    expect(skillMarkdown).toContain("npx everyscreen start");
  });
}

test("installing twice keeps one skill file", async () => {
  await installSkill("claude", rootFolder);
  const installedFile = await installSkill("claude", rootFolder);
  const skillMarkdown = await readFile(installedFile, "utf8");

  expect(skillMarkdown.match(/^name: everyscreen$/gm)).toHaveLength(1);
});
