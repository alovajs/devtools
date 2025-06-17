---
'@alova/wormhole': patch
---

Fixes issue where invalid responses like {"code": -1, "msg": "URL does not exist"} would generate empty apiDefinitions and global objects.
