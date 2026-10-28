import { access, copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export type SkillAgent = "claude" | "codex" | "cursor";

// Claude Code: https://code.claude.com/docs/en/skills
// Codex: https://developers.openai.com/codex/skills
// Cursor: https://cursor.com/docs/context/skills
const SKILL_FOLDERS = {
  claude: ".claude/skills/everyscreen",
  codex: ".agents/skills/everyscreen",
  cursor: ".cursor/skills/everyscreen",
} as const satisfies Record<SkillAgent, string>;

// Next to this file in src/, and in src/skill/ when the code runs from the dist/ bundle.
const SKILL_FILE_URLS = [
  new URL("./SKILL.md", import.meta.url),
  new URL("../src/skill/SKILL.md", import.meta.url),
];

const findSkillFile = async (): Promise<string> => {
  for (const skillFileUrl of SKILL_FILE_URLS) {
    const skillFile = fileURLToPath(skillFileUrl);
    const isSkillFileThere = await access(skillFile).then(
      () => true,
      () => false,
    );
    if (isSkillFileThere) return skillFile;
  }
  throw new Error("SKILL.md is missing from the Everyscreen package");
};

export const installSkill = async (
  agent: SkillAgent,
  rootFolder: string,
): Promise<string> => {
  const skillFolder = join(rootFolder, SKILL_FOLDERS[agent]);
  const installedFile = join(skillFolder, "SKILL.md");
  const skillFile = await findSkillFile();

  await mkdir(skillFolder, { recursive: true });
  await copyFile(skillFile, installedFile);

  return installedFile;
};
