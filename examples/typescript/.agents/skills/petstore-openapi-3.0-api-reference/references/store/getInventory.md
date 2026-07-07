# IMPORTANT: Enforce before generating code (must not be violated)!!!

Before executing the code generation task, recite the following usage conventions and ensure compliance when generating.

## Usage Conventions

1. The API defined in this document is located at `src/api/alova/store`
2. Follow the calling method shown in the example below.

## API

Returns pet inventories by status

`[GET] /store/inventory`

## Response

Use the response data as needed:

```typescript
Record<string, number>
```

## Usage Example

```typescript
getInventory({})

```
