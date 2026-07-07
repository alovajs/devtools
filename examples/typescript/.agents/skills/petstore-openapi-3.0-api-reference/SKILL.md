---
name: Petstore - OpenAPI 3.0-api-reference
description: >-
  API reference documentation for Alova Functional (Petstore - OpenAPI 3.0 v1.0.0).
  Contains specifications for all REST API endpoints, including HTTP request methods,
  URL paths, path/query parameters, request body schemas, and response types.
  Use this skill whenever you need to: call Alova Functional backend APIs,
  look up endpoint details and parameter requirements, understand request/response
  data structures, or integrate frontend code with Alova Functional services.
  Key domains covered: pet, store, user.
---

> version 1.0.0

## Overview

This skill provides complete API reference documentation for Alova Functional.
When you need to call any endpoint in this service, consult the corresponding
API document in the references directory for detailed parameter schemas,
request/response formats, and usage examples.

## API Directory (Alova Functional)

- **pet**
  - [Add a new pet to the store](./references/pet/addPet.md) `[POST] /pet`
  - [Update an existing pet](./references/pet/updatePet.md) `[PUT] /pet`
  - [Finds Pets by status](./references/pet/findPetsByStatus.md) `[GET] /pet/findByStatus`
  - [Find pet by ID](./references/pet/getPetById.md) `[GET] /pet/{petId}`
  - [Deletes a pet](./references/pet/deletePet.md) `[DELETE] /pet/{petId}`
- **store**
  - [Returns pet inventories by status](./references/store/getInventory.md) `[GET] /store/inventory`
  - [Place an order for a pet](./references/store/placeOrder.md) `[POST] /store/order`
  - [Find purchase order by ID](./references/store/getOrderById.md) `[GET] /store/order/{orderId}`
  - [Cancel purchase order by ID](./references/store/cancelOrder.md) `[POST] /store/order/{orderId}/cancel`
- **user**
  - [Logs user into the system](./references/user/loginUser.md) `[GET] /user/login`
