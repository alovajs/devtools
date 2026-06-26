/**
 * OpenAPI Spec Generator — 生成 200/500/1000/5000 数量级的测试 Spec
 *
 * 使用方法: tsx scripts/generate-specs.ts
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── Schemas ────────────────────────────────────────

interface SchemaDef {
  type: string
  properties?: Record<string, any>
  required?: string[]
  items?: any
  enum?: string[]
  [key: string]: any
}

const SCHEMAS: Record<string, SchemaDef> = {
  User: {
    type: 'object',
    required: ['id', 'name', 'email'],
    properties: {
      id: { type: 'integer', format: 'int64', description: '唯一标识' },
      name: { type: 'string', description: '用户名', example: 'john_doe' },
      email: { type: 'string', format: 'email', description: '邮箱地址' },
      phone: { type: 'string', description: '电话号码' },
      role: { type: 'string', enum: ['admin', 'user', 'moderator'], description: '角色' },
      status: { type: 'string', enum: ['active', 'inactive', 'suspended'], description: '状态' },
      avatar: { type: 'string', format: 'uri', description: '头像 URL' },
      metadata: { type: 'object', additionalProperties: { type: 'string' }, description: '扩展元数据' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Pet: {
    type: 'object',
    required: ['id', 'name'],
    properties: {
      id: { type: 'integer', format: 'int64' },
      name: { type: 'string', example: 'Buddy' },
      category: { $ref: '#/components/schemas/Category' },
      tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
      photoUrls: { type: 'array', items: { type: 'string', format: 'uri' } },
      age: { type: 'integer', minimum: 0 },
      breed: { type: 'string' },
      status: { type: 'string', enum: ['available', 'pending', 'sold', 'adopted'] },
      ownerId: { type: 'integer', format: 'int64' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  Order: {
    type: 'object',
    required: ['id', 'userId', 'quantity'],
    properties: {
      id: { type: 'integer', format: 'int64' },
      userId: { type: 'integer', format: 'int64' },
      items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
      totalAmount: { type: 'number', format: 'double' },
      currency: { type: 'string', enum: ['USD', 'EUR', 'CNY', 'JPY'] },
      status: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
      shippingAddress: { $ref: '#/components/schemas/Address' },
      payment: { $ref: '#/components/schemas/Payment' },
      notes: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  OrderItem: {
    type: 'object',
    required: ['productId', 'quantity', 'price'],
    properties: {
      productId: { type: 'integer', format: 'int64' },
      productName: { type: 'string' },
      quantity: { type: 'integer', minimum: 1 },
      price: { type: 'number', format: 'double' },
      discount: { type: 'number', format: 'double' },
      subtotal: { type: 'number', format: 'double' },
    },
  },
  Product: {
    type: 'object',
    required: ['id', 'name', 'price'],
    properties: {
      id: { type: 'integer', format: 'int64' },
      name: { type: 'string', example: 'Premium Dog Food' },
      description: { type: 'string' },
      price: { type: 'number', format: 'double' },
      compareAtPrice: { type: 'number', format: 'double' },
      category: { $ref: '#/components/schemas/Category' },
      tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
      sku: { type: 'string' },
      inventory: { type: 'integer', minimum: 0 },
      weight: { type: 'number', format: 'float' },
      dimensions: { $ref: '#/components/schemas/Dimensions' },
      images: { type: 'array', items: { type: 'string', format: 'uri' } },
      rating: { type: 'number', format: 'float', minimum: 0, maximum: 5 },
      reviewCount: { type: 'integer' },
      isActive: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  Category: {
    type: 'object',
    required: ['id', 'name'],
    properties: {
      id: { type: 'integer', format: 'int64' },
      name: { type: 'string', example: 'Dogs' },
      description: { type: 'string' },
      slug: { type: 'string' },
      parentId: { type: 'integer', format: 'int64', nullable: true },
      image: { type: 'string', format: 'uri' },
      sortOrder: { type: 'integer' },
      isActive: { type: 'boolean' },
    },
  },
  Tag: {
    type: 'object',
    properties: {
      id: { type: 'integer', format: 'int64' },
      name: { type: 'string', example: 'friendly' },
      color: { type: 'string', enum: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'] },
    },
  },
  Address: {
    type: 'object',
    required: ['street', 'city', 'country'],
    properties: {
      street: { type: 'string' },
      city: { type: 'string' },
      state: { type: 'string' },
      zipCode: { type: 'string' },
      country: { type: 'string' },
      isDefault: { type: 'boolean' },
    },
  },
  Payment: {
    type: 'object',
    properties: {
      method: { type: 'string', enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'crypto'] },
      amount: { type: 'number', format: 'double' },
      currency: { type: 'string', enum: ['USD', 'EUR', 'CNY'] },
      status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
      transactionId: { type: 'string' },
      paidAt: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  Dimensions: {
    type: 'object',
    properties: {
      length: { type: 'number', format: 'float' },
      width: { type: 'number', format: 'float' },
      height: { type: 'number', format: 'float' },
      unit: { type: 'string', enum: ['cm', 'in', 'mm'] },
    },
  },
  Review: {
    type: 'object',
    required: ['id', 'userId', 'rating'],
    properties: {
      id: { type: 'integer', format: 'int64' },
      userId: { type: 'integer', format: 'int64' },
      productId: { type: 'integer', format: 'int64' },
      orderId: { type: 'integer', format: 'int64' },
      rating: { type: 'integer', minimum: 1, maximum: 5 },
      title: { type: 'string' },
      comment: { type: 'string' },
      images: { type: 'array', items: { type: 'string', format: 'uri' } },
      isVerified: { type: 'boolean' },
      helpfulCount: { type: 'integer' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  Notification: {
    type: 'object',
    required: ['id', 'userId', 'type', 'message'],
    properties: {
      id: { type: 'integer', format: 'int64' },
      userId: { type: 'integer', format: 'int64' },
      type: { type: 'string', enum: ['order_update', 'promotion', 'system', 'review', 'message'] },
      title: { type: 'string' },
      message: { type: 'string' },
      data: { type: 'object', additionalProperties: true },
      isRead: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  File: {
    type: 'object',
    properties: {
      id: { type: 'integer', format: 'int64' },
      filename: { type: 'string' },
      originalName: { type: 'string' },
      mimeType: { type: 'string' },
      size: { type: 'integer', format: 'int64' },
      url: { type: 'string', format: 'uri' },
      thumbnailUrl: { type: 'string', format: 'uri', nullable: true },
      uploadedBy: { type: 'integer', format: 'int64' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  PaginatedResponse: {
    type: 'object',
    properties: {
      data: { type: 'array', items: {} },
      pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' },
        },
      },
      links: {
        type: 'object',
        properties: {
          self: { type: 'string', format: 'uri' },
          next: { type: 'string', format: 'uri', nullable: true },
          prev: { type: 'string', format: 'uri', nullable: true },
          first: { type: 'string', format: 'uri' },
          last: { type: 'string', format: 'uri' },
        },
      },
    },
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      code: { type: 'integer' },
      message: { type: 'string' },
      details: { type: 'array', items: { type: 'string' } },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string' },
    },
  },
  HealthCheck: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
      version: { type: 'string' },
      uptime: { type: 'number', format: 'double' },
      services: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['up', 'down', 'degraded'] },
            latency: { type: 'number', format: 'double' },
          },
        },
      },
    },
  },
}

// ─── 资源组 ──────────────────────────────────────────

interface ResourceDef {
  name: string
  schemaName: string
  hasSearch: boolean
  hasCount: boolean
  hasBatch: boolean
  hasNested: boolean
  nestedResources?: NestedResourceDef[]
}

interface NestedResourceDef {
  name: string
  schemaName: string
}

const RESOURCES: ResourceDef[] = [
  { name: 'users', schemaName: 'User', hasSearch: true, hasCount: true, hasBatch: true, hasNested: true, nestedResources: [
    { name: 'pets', schemaName: 'Pet' },
    { name: 'orders', schemaName: 'Order' },
    { name: 'reviews', schemaName: 'Review' },
    { name: 'notifications', schemaName: 'Notification' },
  ] },
  { name: 'pets', schemaName: 'Pet', hasSearch: true, hasCount: true, hasBatch: false, hasNested: true, nestedResources: [
    { name: 'orders', schemaName: 'Order' },
    { name: 'reviews', schemaName: 'Review' },
  ] },
  { name: 'orders', schemaName: 'Order', hasSearch: true, hasCount: true, hasBatch: true, hasNested: false },
  { name: 'products', schemaName: 'Product', hasSearch: true, hasCount: true, hasBatch: true, hasNested: true, nestedResources: [
    { name: 'reviews', schemaName: 'Review' },
  ] },
  { name: 'categories', schemaName: 'Category', hasSearch: false, hasCount: true, hasBatch: false, hasNested: true, nestedResources: [
    { name: 'products', schemaName: 'Product' },
  ] },
  { name: 'reviews', schemaName: 'Review', hasSearch: false, hasCount: true, hasBatch: false, hasNested: false },
  { name: 'notifications', schemaName: 'Notification', hasSearch: false, hasCount: true, hasBatch: true, hasNested: false },
  { name: 'files', schemaName: 'File', hasSearch: false, hasCount: false, hasBatch: true, hasNested: false },
]

// ─── 操作生成器 ──────────────────────────────────────

function createParam(name: string, location: string, type: string, required: boolean, description: string) {
  return { name, in: location, required, description, schema: { type } }
}

function createRefResponse(ref: string, description: string) {
  return { description, content: { 'application/json': { schema: { $ref: ref } } } }
}

function createArrayResponse(ref: string, description: string) {
  return {
    description,
    content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } },
  }
}

function createEmptyResponse(description: string) {
  return { description }
}

function createRequestBody(ref: string, required: boolean = true) {
  return {
    required,
    content: { 'application/json': { schema: { $ref: ref } } },
  }
}

function createErrorResponses() {
  return {
    400: createRefResponse('#/components/schemas/ErrorResponse', '请求参数错误'),
    401: createRefResponse('#/components/schemas/ErrorResponse', '未认证'),
    403: createRefResponse('#/components/schemas/ErrorResponse', '权限不足'),
    404: createRefResponse('#/components/schemas/ErrorResponse', '资源不存在'),
    500: createRefResponse('#/components/schemas/ErrorResponse', '服务器内部错误'),
  }
}

const COMMON_LIST_PARAMS = [
  createParam('page', 'query', 'integer', false, '页码'),
  createParam('pageSize', 'query', 'integer', false, '每页数量'),
  createParam('sort', 'query', 'string', false, '排序字段'),
  createParam('order', 'query', 'string', false, '排序方向 (asc/desc)'),
]

function addListOperation(pathObj: Record<string, any>, resource: ResourceDef) {
  pathObj.get = {
    tags: [resource.name],
    summary: `获取${resource.name}列表`,
    operationId: `list${capitalize(resource.name)}`,
    parameters: [...COMMON_LIST_PARAMS],
    responses: {
      200: createArrayResponse(`#/components/schemas/${resource.schemaName}`, `成功获取${resource.name}列表`),
      ...createErrorResponses(),
    },
  }
}

function addCreateOperation(pathObj: Record<string, any>, resource: ResourceDef) {
  pathObj.post = {
    tags: [resource.name],
    summary: `创建${resource.name}`,
    operationId: `create${capitalizeSingular(resource.name)}`,
    requestBody: createRequestBody(`#/components/schemas/${resource.schemaName}`),
    responses: {
      201: createRefResponse(`#/components/schemas/${resource.schemaName}`, '创建成功'),
      ...createErrorResponses(),
    },
  }
}

function addGetByIdOperation(pathObj: Record<string, any>, resource: ResourceDef) {
  pathObj.get = {
    tags: [resource.name],
    summary: `获取${singular(resource.name)}详情`,
    operationId: `get${capitalizeSingular(resource.name)}ById`,
    parameters: [createParam('id', 'path', 'integer', true, `${singular(resource.name)} ID`)],
    responses: {
      200: createRefResponse(`#/components/schemas/${resource.schemaName}`, '获取成功'),
      ...createErrorResponses(),
    },
  }
}

function addUpdateOperation(pathObj: Record<string, any>, resource: ResourceDef) {
  pathObj.put = {
    tags: [resource.name],
    summary: `更新${singular(resource.name)}`,
    operationId: `update${capitalizeSingular(resource.name)}`,
    parameters: [createParam('id', 'path', 'integer', true, `${singular(resource.name)} ID`)],
    requestBody: createRequestBody(`#/components/schemas/${resource.schemaName}`),
    responses: {
      200: createRefResponse(`#/components/schemas/${resource.schemaName}`, '更新成功'),
      ...createErrorResponses(),
    },
  }
}

function addDeleteOperation(pathObj: Record<string, any>, resource: ResourceDef) {
  pathObj.delete = {
    tags: [resource.name],
    summary: `删除${singular(resource.name)}`,
    operationId: `delete${capitalizeSingular(resource.name)}`,
    parameters: [createParam('id', 'path', 'integer', true, `${singular(resource.name)} ID`)],
    responses: {
      204: createEmptyResponse('删除成功'),
      ...createErrorResponses(),
    },
  }
}

function addSearchOperation(pathObj: Record<string, any>, resource: ResourceDef) {
  pathObj.get = {
    tags: [resource.name],
    summary: `搜索${resource.name}`,
    operationId: `search${capitalize(resource.name)}`,
    parameters: [
      createParam('q', 'query', 'string', true, '搜索关键词'),
      createParam('fields', 'query', 'string', false, '搜索字段，逗号分隔'),
      createParam('filters', 'query', 'string', false, 'JSON 格式的过滤条件'),
      ...COMMON_LIST_PARAMS,
    ],
    responses: {
      200: createArrayResponse(`#/components/schemas/${resource.schemaName}`, '搜索结果'),
      ...createErrorResponses(),
    },
  }
}

function addCountOperation(pathObj: Record<string, any>, resource: ResourceDef) {
  pathObj.get = {
    tags: [resource.name],
    summary: `统计${resource.name}数量`,
    operationId: `count${capitalize(resource.name)}`,
    responses: {
      200: {
        description: '统计结果',
        content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'integer' } } } } },
      },
      ...createErrorResponses(),
    },
  }
}

function addBatchCreate(pathObj: Record<string, any>, resource: ResourceDef) {
  pathObj.post = {
    tags: [resource.name],
    summary: `批量创建${resource.name}`,
    operationId: `batchCreate${capitalize(resource.name)}`,
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: `#/components/schemas/${resource.schemaName}` } },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: '批量创建成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                items: { type: 'array', items: { $ref: `#/components/schemas/${resource.schemaName}` } },
                failed: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
      ...createErrorResponses(),
    },
  }
}

// ─── 辅助函数 ────────────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function singular(s: string) {
  return s.endsWith('s') ? s.slice(0, -1) : s
}
function capitalizeSingular(s: string) {
  return capitalize(singular(s))
}

// ─── 基础资源路径生成 ────────────────────────────────

function addBaseResourcePaths(paths: Record<string, any>, resource: ResourceDef): number {
  let count = 0

  // 基本 CRUD — 5 个端点
  const basePath = `/api/v1/${resource.name}`
  if (!paths[basePath]) {
    paths[basePath] = {}
    addListOperation(paths[basePath], resource)
    addCreateOperation(paths[basePath], resource)
    count += 2
  }

  const detailPath = `/api/v1/${resource.name}/{id}`
  if (!paths[detailPath]) {
    paths[detailPath] = {}
    addGetByIdOperation(paths[detailPath], resource)
    addUpdateOperation(paths[detailPath], resource)
    addDeleteOperation(paths[detailPath], resource)
    count += 3
  }

  // 搜索
  if (resource.hasSearch) {
    const searchPath = `/api/v1/${resource.name}/search`
    if (!paths[searchPath]) {
      paths[searchPath] = {}
      addSearchOperation(paths[searchPath], resource)
      count++
    }
  }

  // 计数
  if (resource.hasCount) {
    const countPath = `/api/v1/${resource.name}/count`
    if (!paths[countPath]) {
      paths[countPath] = {}
      addCountOperation(paths[countPath], resource)
      count++
    }
  }

  // 批量操作
  if (resource.hasBatch) {
    const batchPath = `/api/v1/${resource.name}/batch`
    if (!paths[batchPath]) {
      paths[batchPath] = {}
      addBatchCreate(paths[batchPath], resource)
      count++
    }
  }

  // 嵌套资源
  if (resource.hasNested && resource.nestedResources) {
    for (const nested of resource.nestedResources) {
      const nestedListPath = `/api/v1/${resource.name}/{parentId}/${nested.name}`
      if (!paths[nestedListPath]) {
        paths[nestedListPath] = {
          get: {
            tags: [resource.name, nested.name],
            summary: `获取${singular(resource.name)}的${nested.name}列表`,
            operationId: `list${capitalize(resource.name)}${capitalize(nested.name)}`,
            parameters: [
              createParam('parentId', 'path', 'integer', true, `${singular(resource.name)} ID`),
              ...COMMON_LIST_PARAMS,
            ],
            responses: {
              200: createArrayResponse(`#/components/schemas/${nested.schemaName}`, `成功获取列表`),
              ...createErrorResponses(),
            },
          },
          post: {
            tags: [resource.name, nested.name],
            summary: `为${singular(resource.name)}创建${singular(nested.name)}`,
            operationId: `create${capitalizeSingular(resource.name)}${capitalizeSingular(nested.name)}`,
            parameters: [createParam('parentId', 'path', 'integer', true, `${singular(resource.name)} ID`)],
            requestBody: createRequestBody(`#/components/schemas/${nested.schemaName}`),
            responses: {
              201: createRefResponse(`#/components/schemas/${nested.schemaName}`, '创建成功'),
              ...createErrorResponses(),
            },
          },
        }
        count += 2
      }
    }
  }

  return count
}

/** 生成一个带编号的资源路径组: /api/v1/{name}-{suffix}，每个组 5 个端点 */
function addNumberedResource(paths: Record<string, any>, resource: ResourceDef, suffix: number): number {
  const resName = `${resource.name}-${suffix}`
  let count = 0

  // GET + POST on collection
  const collectionPath = `/api/v1/${resName}`
  paths[collectionPath] = {
    get: {
      tags: [resName],
      summary: `获取${resName}列表`,
      operationId: `list${capitalize(resName)}`,
      parameters: [...COMMON_LIST_PARAMS],
      responses: {
        200: createArrayResponse(`#/components/schemas/${resource.schemaName}`, '成功'),
        ...createErrorResponses(),
      },
    },
    post: {
      tags: [resName],
      summary: `创建${singular(resName)}`,
      operationId: `create${capitalizeSingular(resName)}`,
      requestBody: createRequestBody(`#/components/schemas/${resource.schemaName}`),
      responses: {
        201: createRefResponse(`#/components/schemas/${resource.schemaName}`, '创建成功'),
        ...createErrorResponses(),
      },
    },
  }
  count += 2

  // GET + PUT + DELETE on item
  const itemPath = `/api/v1/${resName}/{id}`
  paths[itemPath] = {
    get: {
      tags: [resName],
      summary: `获取${singular(resName)}详情`,
      operationId: `get${capitalizeSingular(resName)}ById`,
      parameters: [createParam('id', 'path', 'integer', true, `${singular(resName)} ID`)],
      responses: {
        200: createRefResponse(`#/components/schemas/${resource.schemaName}`, '获取成功'),
        ...createErrorResponses(),
      },
    },
    put: {
      tags: [resName],
      summary: `更新${singular(resName)}`,
      operationId: `update${capitalizeSingular(resName)}`,
      parameters: [createParam('id', 'path', 'integer', true, `${singular(resName)} ID`)],
      requestBody: createRequestBody(`#/components/schemas/${resource.schemaName}`),
      responses: {
        200: createRefResponse(`#/components/schemas/${resource.schemaName}`, '更新成功'),
        ...createErrorResponses(),
      },
    },
    delete: {
      tags: [resName],
      summary: `删除${singular(resName)}`,
      operationId: `delete${capitalizeSingular(resName)}`,
      parameters: [createParam('id', 'path', 'integer', true, `${singular(resName)} ID`)],
      responses: {
        204: createEmptyResponse('删除成功'),
        ...createErrorResponses(),
      },
    },
  }
  count += 3

  return count
}

// ─── 主生成函数 ──────────────────────────────────────

/** 每组编号资源提供几个端点 */
const ENDPOINTS_PER_NUMBERED_GROUP = 5

function generateSpec(totalEndpoints: number) {
  const paths: Record<string, any> = {}
  let endpointCount = 0

  // 添加健康检查、文件上传等通用端点
  paths['/api/v1/health'] = {
    get: {
      tags: ['system'],
      summary: '健康检查',
      operationId: 'healthCheck',
      responses: {
        200: createRefResponse('#/components/schemas/HealthCheck', '服务健康状态'),
        ...createErrorResponses(),
      },
    },
  }
  endpointCount++

  paths['/api/v1/upload'] = {
    post: {
      tags: ['files'],
      summary: '上传文件',
      operationId: 'uploadFile',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: { type: 'string', format: 'binary' },
                folder: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: createRefResponse('#/components/schemas/File', '上传成功'),
        ...createErrorResponses(),
      },
    },
  }
  endpointCount++

  // 阶段 1：生成所有 8 个基础资源的完整路径
  for (const resource of RESOURCES) {
    if (endpointCount >= totalEndpoints)
      break
    endpointCount += addBaseResourcePaths(paths, resource)
  }

  // 阶段 2：对剩余端点，用编号资源补齐
  // 每个编号资源提供 ENDPOINTS_PER_NUMBERED_GROUP 个端点
  const remainingTarget = totalEndpoints - endpointCount
  const numberedGroupCount = Math.ceil(remainingTarget / ENDPOINTS_PER_NUMBERED_GROUP)

  for (let i = 0; i < numberedGroupCount && endpointCount < totalEndpoints; i++) {
    const resource = RESOURCES[i % RESOURCES.length]
    endpointCount += addNumberedResource(paths, resource, i + 1)
  }

  console.log(`  Generated ${endpointCount} endpoints (target: ${totalEndpoints})`)

  const spec = {
    openapi: '3.0.3',
    info: {
      title: `Petstore API (${totalEndpoints} endpoints)`,
      version: '1.0.0',
      description: `Auto-generated OpenAPI spec with approximately ${totalEndpoints} endpoints for benchmark testing.`,
    },
    servers: [{ url: 'https://api.petstore.example.com/v1' }],
    tags: [
      ...RESOURCES.map(r => ({ name: r.name, description: `${capitalize(r.name)} related endpoints` })),
      { name: 'system', description: '系统端点' },
    ],
    paths,
    components: {
      schemas: SCHEMAS,
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }

  return spec
}

// ─── 入口 ────────────────────────────────────────────

const SCALES = [200, 500, 1000, 5000]
// __dirname: tsx 提供; 降级: import.meta.url
const SCRIPT_DIR = typeof __dirname !== 'undefined'
  ? __dirname
  : fileURLToPath(new URL('.', import.meta.url))
const SPECS_DIR = resolve(SCRIPT_DIR, '..', 'specs')

if (!existsSync(SPECS_DIR)) {
  mkdirSync(SPECS_DIR, { recursive: true })
}

for (const scale of SCALES) {
  console.log(`Generating spec with ~${scale} endpoints...`)
  const spec = generateSpec(scale)

  // 统计实际端点数
  let actualCount = 0
  for (const _ of Object.values(spec.paths)) {
    for (const __ of Object.values(_ as Record<string, any>)) {
      actualCount++
    }
  }
  console.log(`  Actual endpoints: ${actualCount}`)

  const filePath = resolve(SPECS_DIR, `petstore-${scale}.json`)
  writeFileSync(filePath, JSON.stringify(spec, null, 2))
  console.log(`  Written to: ${filePath} (${(JSON.stringify(spec).length / 1024 / 1024).toFixed(2)} MB)`)
  console.log()
}

console.log('Done! All specs generated.')
