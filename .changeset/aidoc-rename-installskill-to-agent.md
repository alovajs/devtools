---
"wormajs": minor
---

Rename the `aiDoc` plugin's exported `parseEnvFile` to `parseAgentFile` (now falls back to `.wormaagent.local` in the project root when no path is given), and replace the `installSkill` config option with `agent`. The `agent` option accepts a `SkillAgent`, an array of `SkillAgent`, or a comma-separated string; omitting it no longer installs the skill.
