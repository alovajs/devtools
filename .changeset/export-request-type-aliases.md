---
"wormajs": minor
---

Export the request/response types of every generated API.

The alova/axios/fetch/ky templates only exposed the inline, non-exported `XxxExtraConfig` type, so the query-parameter type of an operation could not be referenced from user code (e.g. when annotating the form parameter of alova's `useForm`, which cannot infer it from the handler return value).

Every generated API now also emits exported named aliases, prefixed with the generated function name and only when the corresponding parameter exists:

- `xxxPathParams` – path parameters (`pathParams`)
- `xxxParams` – query parameters (`params`, `searchParams` for ky)
- `xxxData` – request body (`data`, `body` for fetch, `json` for ky)
- `xxxResponse` – response data type
- `xxxExtraConfig` – the full config accepted by the generated function

`xxxExtraConfig` now references these aliases instead of repeating the inline types, so the resolved types are unchanged. The `alova` template also exports `xxxResponse` (previously inlined in the method signature) and reuses it there. The `alova-globals` template is untouched.

```ts
import { useForm } from 'alova/client';
import { findPetsByStatus } from './api/services/pet';
import type { findPetsByStatusParams } from './api/services/pet';

const { send } = useForm((params: findPetsByStatusParams) => findPetsByStatus({ params }));
```
