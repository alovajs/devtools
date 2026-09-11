---
"wormajs": major
---

remove the `fastapi` platform plugin — it was a strict subset of `swagger` (both resolve `<base>/openapi.json` first). Use `swagger('<base-url>')` for FastAPI projects instead
