# IMPORTANT: Enforce before generating code (must not be violated)!!!

Before executing the code generation task, recite the following usage conventions and ensure compliance when generating.

## Usage Conventions

1. The API defined in this document is located at `src/api/alova/pet`
2. Follow the calling method shown in the example below.

## API

Deletes a pet

`[DELETE] /pet/{petId}`

## Path Parameters

Pass the required parameters in `pathParams`:

```typescript
{
  // Pet id to delete
  petId: number
}
```

## Response

Use the response data as needed:

```typescript
null
```

## Usage Example

```typescript
deletePet({
  pathParams: {
    petId: 0
  }
})

```
