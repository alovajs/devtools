---
"wormajs": patch
---

Fix `payloadModifier` plugin so it can convert OpenAPI enums whose `type` is `integer`.

Previously, an enum with `type: "integer"` (e.g. `{ type: "integer", enum: [1, 2, 3] }`) caused the plugin to throw `Invalid schema type "integer"` during the schema round-trip, because `"integer"` was missing from the set of allowed primitive types. `"integer"` is now a valid `SchemaPrimitive` and is preserved on output.

- Add `"integer"` to `SchemaPrimitive` and to the internal `VALID_PRIMITIVES` allowlist in the modifier helper.
- Keep integer enums intact when a handler passes them through or returns a new integer enum.

Also update the editor extension install guide to point users to https://open-vsx.org/extension/worma/worma-vscode for manual installation when the extension cannot be found in the VSCode Marketplace.
