# IMPORTANT: Enforce before generating code (must not be violated)!!!

Before executing the code generation task, recite the following usage conventions and ensure compliance when generating.

## Usage Conventions

1. The API defined in this document is located at `src/api/alova/pet`
2. Follow the calling method shown in the example below.

## API

Finds Pets by status

`[GET] /pet/findByStatus`



## Response

Use the response data as needed:

```typescript
Array<{
  id?: number
  name: string
  category?: {
    id?: number
    name?: string
  }
  // [items] start
  // [items] end
  photoUrls: string[]
  // [items] start
  // [items] end
  tags?: Array<{
    id?: number
    name?: string
  }>
  // pet status in the store
  status?: "available" | "pending" | "sold"
}>
```

## Usage Example

```typescript
findPetsByStatus({
  params: {
    status: 'available'
  }
})

```
