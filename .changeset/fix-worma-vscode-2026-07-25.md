---
"wormajs": patch
"worma-vscode": patch
---

Fix OpenAPI circular-reference detection by replacing `Object.prototype.hasOwnProperty.call` with the native `Object.hasOwn`, and stabilize unit tests. Update VS Code extension to use `Date.now()` for id generation, fix import ordering, and adjust publish script order.
