import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readStoredFile, writeStoredFile } from "@/hub/stored-files";

export const SKILL_AGENTS = ["claude", "codex", "cursor"] as const;

export type SkillAgent = (typeof SKILL_AGENTS)[number];

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

const readSkillMarkdown = async (): Promise<string> => {
  for (const skillFileUrl of SKILL_FILE_URLS) {
    const skillMarkdown = await readStoredFile(fileURLToPath(skillFileUrl));
    const isSkillMarkdownFound = skillMarkdown !== null;
    if (isSkillMarkdownFound) return skillMarkdown;
  }
  throw new Error("SKILL.md is missing from the Everyscreen package");
};

export const pickSkillFile = (agent: SkillAgent, rootFolder: string): string =>
  join(rootFolder, SKILL_FOLDERS[agent], "SKILL.md");

export const installSkill = async (
  agent: SkillAgent,
  rootFolder: string,
): Promise<string> => {
  const installedFile = pickSkillFile(agent, rootFolder);
  const skillMarkdown = await readSkillMarkdown();

  await writeStoredFile(installedFile, skillMarkdown);

  return installedFile;
};
