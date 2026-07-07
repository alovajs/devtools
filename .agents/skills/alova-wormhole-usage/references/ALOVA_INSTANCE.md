# Customizing the Alova Instance

After running `alova gen`, edit `${output}/index.[js/ts]` to configure your alova instance. This file is **not overwritten** on subsequent generations.

## Key exports from `createApis`

| Export                            | Purpose                           |
| --------------------------------- | --------------------------------- |
| `createApis(instance, configMap)` | Create the `Apis` object          |
| `withConfigType(map)`             | Define reusable per-method config |
| `mountApis(Apis)`                 | Mount `Apis` globally (optional)  |

## Minimal example

```ts
// src/api/index.ts
import { createAlova } from 'alova';
import GlobalFetch from 'alova/GlobalFetch';
import { createApis, withConfigType, mountApis } from './createApis';

export const alovaInstance = createAlova({
  baseURL: 'https://your-api-server.com',
  requestAdapter: GlobalFetch(),
  responded: (res) => res.json(),
});

export const $$userConfigMap = withConfigType({});
const Apis = createApis(alovaInstance, $$userConfigMap);
mountApis(Apis);
export default Apis;
```

## With auth headers

```ts
export const alovaInstance = createAlova({
  baseURL: 'https://your-api-server.com',
  requestAdapter: GlobalFetch(),
  beforeRequest: (method) => {
    method.config.headers['Authorization'] = `Bearer ${getToken()}`;
  },
  responded: {
    onSuccess: async (res) => {
      const json = await res.json();
      if (json.code !== 200) throw new Error(json.message);
      return json.data;
    },
    onError: (err) => console.error('Request failed', err),
  },
});
```

## Using generated APIs

```ts
import Apis from './api';
import { useRequest } from 'alova';

// Direct call
const data = await Apis.PetController.getPetById({ pathParams: { id: 1 } });

// With hooks (e.g. Vue/React)
const { loading, data, error } = useRequest(
  Apis.PetController.getPetById({ pathParams: { id: 1 } })
);
```

## Reusing existing alova instance

Import existing alova instance and use it to create new apis.

```ts
// src/api/index.ts
import existingAlovaInstance from '@/config/alova';

// ...
const Apis = createApis(alovaInstance, $$userConfigMap);
// ...
```
