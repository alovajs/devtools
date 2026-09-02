---
"wormajs": minor
---

Add a `skillName` option to the `aiDoc` plugin to control the name of the generated skill.

The `skills add` CLI does not support renaming a skill at install time, so the name is taken from the `SKILL.md` frontmatter. `aiDoc` now writes the configured `skillName` into that `name` field before installing the skill into the target coding agent(s).

- `aiDoc({ skillName: 'my-skill' })` sets the installed skill name to `my-skill`.
- When `skillName` is omitted, the skill keeps its previous default name derived from the API title: `apis-<title>`.

This is a minor change because it adds a new optional configuration without altering existing behavior.
