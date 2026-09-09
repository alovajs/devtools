---
'wormajs': major
---

Redesign the `payloadModifier` plugin around raw OpenAPI schemas.

The old implementation round-tripped every field through a private spec DSL (`SchemaObject` → `Schema` → `SchemaObject`), which dropped documentation fields such as `description` whenever a handler returned a node that was not the one it received (the `schema.data` unwrap case being the common one). The plugin now works on raw `SchemaObject` values end to end, so comment preservation is a structural guarantee instead of a best-effort lookup.

Highlights:

- **New declarative pipeline** for every config: interface filter (`path` / `tag`) → redirect (`unwrap`) → locate (`match`) → patch (`patch`) → custom (`handler`).
- **`unwrap`** replaces the scope root with a nested node (e.g. `unwrap: 'data'`), replacing the old `handler: s => s.data` trick.
- **`tag` filter** in addition to `path`, combinable with it.
- **`patch`** covers add / delete / modify with one recursive syntax: `null` deletes, a string or array is a `{ type }` shorthand, an object without reserved keys is a `properties` shorthand, and an object with reserved keys is a partial patch.
- **`handler`** now takes and returns raw OpenAPI schema objects.
- `params` / `pathParams` patches can add brand new parameters.

Breaking changes:

- The private spec DSL is gone: `Schema`, `SchemaReference`, `SchemaEnum`, `SchemaOneOf` / `AnyOf` / `AllOf` and the `SchemaOptional` (`{ required, type }`) wrapper are replaced by `SchemaDSL` / `FieldValue` / `FieldPatchObject`, which only appear in type value positions.
- `handler` receives a raw `SchemaObject` instead of the DSL representation, and returning `undefined` now deletes the target (previously it did the same, but the input shape changed).
- `match` no longer recurses into `oneOf` / `anyOf` / `allOf` branches; it only matches the top-level field names of the current node.
- Array element extraction via `unwrap` is not supported, use `handler` instead.

Migration:

```diff
- { scope: 'response', handler: s => s.data }
+ { scope: 'response', unwrap: 'data' }

- { scope, match: 'id', handler: () => 'string' }
+ { scope, match: 'id', patch: 'string' }

- { scope, match: 'f', handler: () => undefined }
+ { scope, match: 'f', patch: null }

- { scope, match: 'f', handler: () => ({ required: false, type: 'string' }) }
+ { scope, match: 'f', patch: { type: 'string', required: false } }
```
