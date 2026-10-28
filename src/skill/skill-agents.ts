export const SKILL_AGENTS = ["claude", "codex", "cursor"] as const;

export type SkillAgent = (typeof SKILL_AGENTS)[number];
