---
"wormajs": patch
---

Isolate schema worker pools by generator output so concurrent OpenAPI documents cannot resolve references against another generator's document.
