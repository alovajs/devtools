---
'wormajs': minor
---

Record **source-document** changes instead of api-level diffs.

`worma diff` used to compare the generated `Api` objects (method + path + a handful of generated type strings), which hid everything that did not survive into a type string: parameter descriptions leaked into unrelated "modified" fields, operation `summary`/`description` were invisible, and `default` / `format` changes could not be seen at all.

The baseline is now the **source** OpenAPI document — the one parsed from the `beforeSpecParse` output, captured *before* the `specParsed` hooks mutate it. That makes the record a faithful log of the source file rather than a lossy projection of it:

- **Parameter level**: additions, removals and value-definition changes (`type`, `format`, `enum`, `default`, `required`, nullable, nested schemas) are reported per parameter, keyed by `in` + `name`; path-item level parameters are folded into the effective parameter set.
- **Request body / responses**: schema changes are reported as pointers (`requestBody.application/json.properties.name.type`, `responses.200.…`), plus added/removed status codes and media types.
- **Components**: a change under `#/components/…` is repeated once per affected operation (one change per row), resolved through the reverse-`$ref` index including transitive references; unreferenced components use the component ref as target.
- **Document globals**: `info`, `servers`, `tags`, … are reported as `meta` rows.
- Every row carries a `kind` (`api` / `param` / `body` / `resp` / `comp` / `meta`) and a coarse `level` (`breaking` / `additive` / `doc`), where documentation-only edits are labelled `doc` instead of being silently dropped.

Other changes:

- Snapshots live in `<cache>/.worma-cache/snapshots/<output>.json`, one per generator output (never shared between generators, which are not necessarily generated together). The diff runs **after** a successful generation, so a failed run neither computes nor advances the baseline.
- The first run of a project only establishes the baseline, so an existing project no longer reports "everything was added".
- `worma generate` prints the recorded change id(s) and points at `worma diff latest`; a run that recorded nothing (the sources did not change) closes silently.
- `worma diff` renders a single English table (kind / target / item / change / level); the VS Code extension shows the record id in its toast next to `View Changes`, and its "API Changes" webview renders the same columns as a fully bordered grid with the same colour coding (symbol per op, level per severity, everything else default).
- `generate()` accepts a new `onChangeRecorded` option and `listChanges` summaries keep their `added` / `removed` / `modified` fields, so existing callers keep working.
- Legacy change records are read through the same row model, so an existing `.worma-cache/changes` history stays browsable.

Note for consumers reading records programmatically: `ChangeItem` now exposes a flat `changes: SourceChange[]` array instead of the `added` / `removed` / `modified` api lists.
