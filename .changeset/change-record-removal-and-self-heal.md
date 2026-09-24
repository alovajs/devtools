---
"wormajs": minor
---

Add change-record removal and make incremental rendering self-heal.

- `worma diff --remove 0007` (`-r, --remove [id]`) deletes a single recorded change; the id may also be the positional argument (`worma diff 0007 --remove`) and `latest` is accepted. `removeChange(projectPath, id)` is exported for programmatic use and returns the deleted id, or `undefined` when nothing matched. Only the record file under `changes/` is touched — `index.json#changeSeq` stays monotonic, so a deleted sequence number is never handed out again.
- An unchanged tag is now re-rendered when any of its expected artifacts is missing from the output directory, so generated files deleted by hand (or wiped by a clean script while the cache survived) are self-healed on the next `worma gen`. The check derives the expected paths without rendering and short-circuits on the first missing file.
- The `aiDoc` plugin deletes the generated skill directory under the output directory once *every* target agent installed successfully, so the skill is no longer stored twice. A failing install throws before the cleanup and therefore keeps the source directory.
