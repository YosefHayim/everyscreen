import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { installSkill, type SkillAgent } from "@/skill/skill-install";

const SKILL_PATHS: Record<SkillAgent, string> = {
  claude: ".claude/skills/everyscreen/SKILL.md",
  codex: ".agents/skills/everyscreen/SKILL.md",
  cursor: ".cursor/skills/everyscreen/SKILL.md",
};
const AGENTS: SkillAgent[] = ["claude", "codex", "cursor"];

for (const agent of AGENTS) {
  test(`installs the skill where ${agent} reads it`, async () => {
    const rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-skill-"));

    const installedFile = await installSkill(agent, rootFolder);
    const skillText = await readFile(installedFile, "utf8");

    expect(installedFile).toBe(join(rootFolder, SKILL_PATHS[agent]));
    expect(skillText).toContain("name: everyscreen");
    expect(skillText).toContain("npx everyscreen start");
    await rm(rootFolder, { recursive: true });
  });
}

test("installing twice keeps one skill file", async () => {
  const rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-skill-"));

  await installSkill("claude", rootFolder);
  const installedFile = await installSkill("claude", rootFolder);
  const skillText = await readFile(installedFile, "utf8");

  expect(skillText.match(/^name: everyscreen$/gm)).toHaveLength(1);
  await rm(rootFolder, { recursive: true });
});
