---
"wormajs": patch
---

Fix `payloadModifier` so it can convert OpenAPI enums whose `type` is `integer`, and keep documentation through the round-trip.

The `Schema` layer of the plugin is a TypeScript type representation, so only TS primitives are valid there (`integer` is an OpenAPI type, not a TS type). Previously an enum with `type: "integer"` (e.g. `{ type: "integer", enum: [1, 2, 3] }`) was passed to the handler as-is and then rejected while converting back, throwing `Invalid schema type "integer"` and breaking the whole round-trip.

Enums are now converted in both directions:

- OpenAPI -> Schema: the enum `type` is normalized to its TS counterpart, so `integer` becomes `number`. A numeric enum is always exposed to the handler as `{ enum: [1, 2, 3], type: "number" }`, consistent with how plain primitives are converted.
- Schema -> OpenAPI: the TS type is converted back to its OpenAPI counterpart. A numeric enum is written as `integer` only when every value is an integer (`{ enum: [1, 2, 3], type: "integer" }`); if any value is a float (`{ enum: [1.5, 2.5] }`) the type stays `number` so it matches the values. `string` and `boolean` are identical in both representations and need no extra handling.
- Untyped enums: when neither the source schema nor the handler declares a type, the OpenAPI type is inferred from the values (all strings -> `string`, all booleans -> `boolean`, all integers -> `integer`, other numbers -> `number`). Mixed or empty values stay untyped.
- Nullable enums: an OpenAPI 3.1 type array such as `{ type: ["string", "null"], enum: ["a", "b", null] }` is preserved instead of being dropped, and is replaced only when the handler explicitly returns a type.

Documentation is also preserved when a schema is rewritten:

- Nested object properties and array items now receive the original schema as their conversion base, so fields like `description` are no longer dropped (previously every comment was lost as soon as a handler returned an object or an array).
- The obsolete structural fields (`properties`, `required`, `items`, `enum`, `oneOf`, `anyOf`, `allOf`) of the previous type are cleared before the new one is written, so replacing a type no longer leaks stale structure.

Also update the editor extension install guide to point users to https://open-vsx.org/extension/worma/worma-vscode for manual installation when the extension cannot be found in the VSCode Marketplace.
