---
"misolaxi3-vscode": minor
---

Rebuild the "API Changes" panel on the shared Vue webview and make update detection opt-in.

- "API Changes" renders through the shared Vue webview (`api-changes` page) instead of the hand-written HTML string. The extension and the webview now exchange the same `handlers` contract as the other views, and the panel reuses one provider instead of re-registering an `onDidReceiveMessage` listener on every open.
- `worma.autoUpdate.checkOnActivation`, `worma.autoUpdate.checkOnWindowFocus` and `worma.autoUpdate.minInterval` are replaced by `worma.checkOnWindowFocus` (default `false`, i.e. off) and `worma.minInterval`. No check runs on activation any more: detection is opt-in, only triggered when the window regains focus, and still never regenerates anything without confirmation.
