import { resolve } from 'node:path'
import { rename } from '@/plugins/presets/rename'
import { generateWithPlugin } from '../util'

vi.mock('node:fs')
vi.mock('node:fs/promises')
describe('rename plugin', () => {
  it('should rename urls to snakeCase style', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/openapi_300.yaml'), [
      rename({ scope: 'url', style: 'snakeCase' }),
    ])

    // /pet stays as /pet (already camelCase)
    expect(apiDefinitionsFile).toContain(`['POST', '/pet']`)
    // Changes to /pet/find_by_status
    expect(apiDefinitionsFile).toContain(`['GET', '/pet/find_by_status']`)
  })

  it('should rename urls to camelCase style', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({ scope: 'url', style: 'camelCase' }),
    ])

    expect(apiDefinitionsFile).toContain(`/userManagement`)
    expect(apiDefinitionsFile).toContain(`/orderProcessing`)
  })

  it('should apply custom transform function', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({
        scope: 'url',
        // Transform each segment individually: prefix every segment so the full URL is not treated as a single segment
        transform: (descriptor, value) => `custom_${value}`,
      }),
    ])

    // Check for custom prefix in URLs
    expect(apiDefinitionsFile).toMatch(/custom_user_management/)
    expect(apiDefinitionsFile).toMatch(/custom_order_processing/)
  })

  it('should only rename matched urls', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({
        scope: 'url',
        match: 'user',
        style: 'camelCase',
      }),
    ])

    // URLs with 'user' change to camelCase
    expect(apiDefinitionsFile).toMatch(/userManagement/)

    // Other URLs stay the same
    expect(apiDefinitionsFile).toContain(`/order_processing/{order_id}`)
  })

  it('should rename parameters to camelCase', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({ scope: 'params', style: 'camelCase' }),
    ])

    // Check for camelCase parameters
    const hasTransformedParams
      = /pageNumber/.test(globalsFile) || /includeUserDetails/.test(globalsFile) || /sortBy/.test(globalsFile)

    expect(hasTransformedParams).toBeTruthy()
  })

  it('should rename path parameters', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({ scope: 'pathParams', style: 'camelCase' }),
    ])

    // Check for camelCase path parameters
    const hasTransformedPathParams = /\{userId\}/.test(globalsFile)

    expect(hasTransformedPathParams).toBeTruthy()
  })

  it('should rename request body properties', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({ scope: 'data', style: 'camelCase' }),
    ])

    // Check for camelCase request body properties
    const hasTransformedProps
      = /userName/.test(globalsFile) || /emailAddress/.test(globalsFile) || /phoneNumber/.test(globalsFile)

    expect(hasTransformedProps).toBeTruthy()
  })

  it('should rename response properties', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({ scope: 'response', style: 'camelCase' }),
    ])

    // Check for camelCase response properties
    const hasTransformedProps
      = /pageCount/.test(globalsFile) || /totalCount/.test(globalsFile) || /billingAddress/.test(globalsFile)

    expect(hasTransformedProps).toBeTruthy()
  })

  it('should rename the generated function name (name scope)', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({ scope: 'name', style: 'camelCase' }),
    ])

    // operationId "get_all_users" becomes "getAllUsers"
    expect(apiDefinitionsFile).toContain('getAllUsers')
    // operationId "create_order" becomes "createOrder"
    expect(apiDefinitionsFile).toContain('createOrder')
  })

  it('should apply multiple rename configs in sequence', async () => {
    const { apiDefinitionsFile, globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/naming_openapi.yaml'),
      [
        rename([
          // First make URLs snake_case
          { scope: 'url', style: 'snakeCase' },
          // Then make params camelCase
          { scope: 'params', style: 'camelCase' },
        ]),
      ],
    )

    // URLs should be snake_case
    expect(apiDefinitionsFile).toMatch(/user_management/)
    expect(apiDefinitionsFile).toMatch(/order_processing/)

    // Parameters should be camelCase
    const hasTransformedParams = /pageNumber/.test(globalsFile) || /includeUserDetails/.test(globalsFile)

    expect(hasTransformedParams).toBeTruthy()
  })

  it('should convert mixed naming to consistent style', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename([
        // Change all to camelCase
        { scope: 'url', style: 'camelCase' },
        { scope: 'params', style: 'camelCase' },
        { scope: 'pathParams', style: 'camelCase' },
        { scope: 'data', style: 'camelCase' },
        { scope: 'response', style: 'camelCase' },
        { scope: 'refName', style: 'camelCase' },
      ]),
    ])
    // Check if all names use camelCase
    const propsTransformed
      = /userName/.test(globalsFile)
        && /emailAddress/.test(globalsFile)
        && /phoneNumber/.test(globalsFile)
        && /createTime/.test(globalsFile)
        && /lastLoginTime/.test(globalsFile)

    const paramsTransformed
      = /pageNumber/.test(globalsFile) && /itemsPerPage/.test(globalsFile) && /sortBy/.test(globalsFile)
    expect(propsTransformed && paramsTransformed).toBeTruthy()
  })

  it('should convert all styles to snakeCase', async () => {
    const { apiDefinitionsFile, globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/naming_openapi.yaml'),
      [
        rename([
          // Change all to snake_case
          { scope: 'url', style: 'snakeCase' },
          { scope: 'params', style: 'snakeCase' },
          { scope: 'pathParams', style: 'snakeCase' },
          { scope: 'data', style: 'snakeCase' },
          { scope: 'response', style: 'snakeCase' },
          { scope: 'refName', style: 'snakeCase' },
        ]),
      ],
    )
    // URLs should be snake_case
    expect(apiDefinitionsFile).toMatch(/user_management/)
    expect(apiDefinitionsFile).toMatch(/order_processing/)

    // Check if all names use snake_case
    const propsTransformed
      = /user_name/.test(globalsFile) && /email_address/.test(globalsFile) && /phone_number/.test(globalsFile)

    const paramsTransformed = /page_number/.test(globalsFile) && /items_per_page/.test(globalsFile)

    expect(propsTransformed && paramsTransformed).toBeTruthy()
  })

  it('should convert to kebabCase style', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({ scope: 'url', style: 'kebabCase' }),
    ])

    // URLs should use kebab-case
    expect(apiDefinitionsFile).toMatch(/user-management/)
    expect(apiDefinitionsFile).toMatch(/order-processing/)
  })

  it('should convert to pascalCase style', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({ scope: 'data', style: 'pascalCase' }),
    ])

    // Properties should use PascalCase
    expect(globalsFile).toMatch(/UserName/)
    expect(globalsFile).toMatch(/EmailAddress/)
    expect(globalsFile).toMatch(/PhoneNumber/)
  })

  it('should match using regex pattern', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({
        scope: 'url',
        match: /user|order/,
        style: 'camelCase',
      }),
    ])

    // URLs with 'user' or 'order' should change
    expect(apiDefinitionsFile).toMatch(/userManagement/)
    expect(apiDefinitionsFile).toMatch(/orderProcessing/)
  })

  it('should match using function matcher', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({
        scope: 'url',
        match: key => key.includes('user') && !key.includes('detail'),
        style: 'camelCase',
      }),
    ])

    // Only URLs with 'user' but not 'detail' change
    expect(apiDefinitionsFile).toMatch(/userManagement/)
  })

  it('should throw error when neither style nor transform is provided', async () => {
    expect(() => {
      rename({ scope: 'url' })
    }).toThrow('at least one of `style` or `transform` is required')
  })

  it('should throw error when kebabCase style is used with refName scope', () => {
    // rename() throws synchronously during config validation, before generate runs
    expect(() => {
      rename({ scope: 'refName', style: 'kebabCase' })
    }).toThrow('Invalid rename style: kebabCase, refName')
  })

  it('should correctly handle path parameter placeholders', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({
        scope: 'pathParams',
        style: 'camelCase',
      }),
    ])

    // Path parameters should be replaced correctly
    expect(apiDefinitionsFile).toMatch(/\{userId\}/)
    expect(apiDefinitionsFile).toMatch(/\{orderId\}/)
  })

  it('should apply both style and transform function', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({
        scope: 'url',
        style: 'camelCase',
        transform: descriptor => `${descriptor.url}_transformed`,
      }),
    ])

    // Apply transform then style
    expect(apiDefinitionsFile).toMatch(/userManagementTransformed/)
    expect(apiDefinitionsFile).toMatch(/orderProcessingTransformed/)
  })

  it('should rename refName map values with camelCase style', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({ scope: 'refName', style: 'camelCase' }),
    ])
    // Expect model/ref names to be converted to camelCase in type declarations
    // e.g. User_Info -> userInfo, Order_Detail -> orderDetail

    expect(globalsFile).toContain('export interface orderItem {')
    expect(globalsFile).toContain('export interface orderCreate {')
  })

  it('should rename refName map values using custom transform', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({
        scope: 'refName',
        // Prefix each refName (value) so the generated type names stay unique and never collide
        transform: (descriptor, value) => `X_${value}`,
      }),
    ])
    expect(globalsFile).toContain('export interface X_UserUpdate {')
    expect(globalsFile).toContain('export interface X_OrderCreate {')
  })

  // ---- The following are unit tests calling handleApi directly, to avoid relying on file writes (memfs) ----
  function runRename(descriptor: any, config: any): any {
    const plugin = rename(config)
    return plugin.config({ config: {} as any }).handleApi(descriptor as any)
  }

  it('should deep-rename nested object and array-item properties (data scope)', () => {
    const descriptor = {
      url: '/test',
      method: 'post',
      requestBody: {
        type: 'object',
        properties: {
          user_name: { type: 'string' },
          address: {
            type: 'object',
            properties: {
              street_name: { type: 'string' },
              city_name: { type: 'string' },
            },
          },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tag_name: { type: 'string' },
              },
            },
          },
        },
      },
    }

    const result = runRename(descriptor, { scope: 'data', style: 'camelCase' })

    expect(result.requestBody.properties.userName).toBeDefined()
    expect(result.requestBody.properties.address.properties.streetName).toBeDefined()
    expect(result.requestBody.properties.address.properties.cityName).toBeDefined()
    expect(result.requestBody.properties.tags.items.properties.tagName).toBeDefined()
  })

  it('should pass nesting level to match function (level starts at 0)', () => {
    const levels: number[] = []
    const descriptor = {
      url: '/test',
      method: 'post',
      requestBody: {
        type: 'object',
        properties: {
          user_name: { type: 'string' },
          address: {
            type: 'object',
            properties: {
              street_name: { type: 'string' },
            },
          },
        },
      },
    }

    const result = runRename(descriptor, {
      scope: 'data',
      // Only rename properties at the top level (level === 0)
      match: (key: string, level?: number) => {
        levels.push(level ?? -1)
        return level === 0
      },
      style: 'camelCase',
    })

    // Top-level properties are renamed
    expect(result.requestBody.properties.userName).toBeDefined()
    // Nested level (level === 1) does not match, so the original name is kept
    expect(result.requestBody.properties.address.properties.street_name).toBeDefined()
    expect(result.requestBody.properties.address.properties.streetName).toBeUndefined()
    expect(levels).toContain(0)
    expect(levels).toContain(1)
  })

  it('should throw when deep rename causes duplicate property names (data scope)', () => {
    const descriptor = {
      url: '/test',
      method: 'post',
      requestBody: {
        type: 'object',
        properties: {
          foo_bar: { type: 'string' },
          fooBar: { type: 'string' },
        },
      },
    }

    expect(() => runRename(descriptor, { scope: 'data', style: 'camelCase' })).toThrow(/Duplicate names found after renaming/)
  })

  it('should throw when rename causes duplicate param names (params scope)', () => {
    const descriptor = {
      url: '/test',
      method: 'get',
      parameters: [
        { name: 'page_num', in: 'query' },
        { name: 'pageNum', in: 'query' },
      ],
    }

    expect(() => runRename(descriptor, { scope: 'params', style: 'camelCase' })).toThrow(/Duplicate names found after renaming/)
  })

  it('should throw when rename causes duplicate refName values (refName scope)', () => {
    const descriptor = {
      url: '/test',
      method: 'get',
      refNameMap: {
        '#/components/schemas/Foo_Bar': 'Foo_Bar',
        '#/components/schemas/foo_bar': 'foo_bar',
      },
    }

    expect(() => runRename(descriptor, { scope: 'refName', style: 'camelCase' })).toThrow(/Duplicate names found after renaming/)
  })

  it('should list the conflicting original keys in the duplicate error (data scope)', () => {
    const descriptor = {
      url: '/test',
      method: 'post',
      requestBody: {
        type: 'object',
        properties: {
          foo_bar: { type: 'string' },
          fooBar: { type: 'string' },
        },
      },
    }

    let error: Error | undefined
    try {
      runRename(descriptor, { scope: 'data', style: 'camelCase' })
    }
    catch (e) {
      error = e as Error
    }

    expect(error).toBeInstanceOf(Error)
    // The duplicated renamed name is listed
    expect(error!.message).toMatch(/Duplicate names found after renaming/)
    // The original keys that collided are listed alongside the renamed key
    expect(error!.message).toMatch(/fooBar\s*<-\s*\[foo_bar, fooBar\]/)
  })

  it('should rename the function name via the name scope (handleApi)', () => {
    const descriptor = {
      url: '/test',
      method: 'get',
      operationId: 'get_all_users',
    }

    const result = runRename(descriptor, { scope: 'name', style: 'camelCase' })

    expect(result.operationId).toBe('getAllUsers')
  })

  it('should apply a custom transform to the function name (name scope)', () => {
    const descriptor = {
      url: '/test',
      method: 'get',
      operationId: 'get_all_users',
    }

    const result = runRename(descriptor, {
      scope: 'name',
      // Apply a custom prefix to the function name
      transform: (descriptor, value) => `api_${value}`,
    })

    expect(result.operationId).toBe('api_get_all_users')
  })

  it('should keep the original function name when name scope does not match', () => {
    const descriptor = {
      url: '/test',
      method: 'get',
      operationId: 'get_all_users',
    }

    const result = runRename(descriptor, {
      scope: 'name',
      match: 'order',
      style: 'camelCase',
    })

    expect(result.operationId).toBe('get_all_users')
  })

  it('should not throw when operationId is empty/undefined for name scope', () => {
    // operationId missing entirely
    const withoutId = runRename(
      { url: '/test', method: 'get' },
      { scope: 'name', match: 'user', style: 'camelCase' },
    )
    expect(withoutId.operationId).toBeUndefined()

    // operationId explicitly empty string
    const emptyId = runRename(
      { url: '/test', method: 'get', operationId: '' },
      { scope: 'name', match: 'user', style: 'camelCase' },
    )
    expect(emptyId.operationId).toBe('')
  })
})
