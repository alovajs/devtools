# IMPORTANT: Enforce before generating code (must not be violated)!!!

Before executing the code generation task, recite the following usage conventions and ensure compliance when generating.

## Usage Conventions

1. The API defined in this document is located at `src/api/alova/store`
2. Follow the calling method shown in the example below.

## API

Place an order for a pet

`[POST] /store/order`

## Request Body

Pass the required request body in `data`:

```typescript
{
  id?: number
  petId?: number
  quantity?: number
  shipDate?: string
  // Order Status
  status?: "placed" | "approved" | "delivered"
  complete?: boolean
}
```

## Response

Use the response data as needed:

```typescript
{
  id?: number
  petId?: number
  quantity?: number
  shipDate?: string
  // Order Status
  status?: "placed" | "approved" | "delivered"
  complete?: boolean
}
```

## Usage Example

```typescript
placeOrder({ data: {} })

```
