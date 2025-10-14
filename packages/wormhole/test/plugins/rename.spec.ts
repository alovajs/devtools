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
        transform: descriptor => `/custom_prefix${descriptor.url}`,
      }),
    ])

    // Check for custom prefix in URLs
    expect(apiDefinitionsFile).toMatch(/custom_prefix/)
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
    const hasCamelCasedRefNames
      = /type\s+userInfo\b/.test(globalsFile)
        || /interface\s+userInfo\b/.test(globalsFile)
        || /type\s+orderDetail\b/.test(globalsFile)
        || /interface\s+orderDetail\b/.test(globalsFile)

    expect(hasCamelCasedRefNames).toBeTruthy()
  })

  it('should rename refName map values using custom transform', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/naming_openapi.yaml'), [
      rename({
        scope: 'refName',
        transform: descriptor => `X_${descriptor.refNameMap?.['#/components/schemas/User_Info'] ?? 'Model'}`,
      }),
    ])

    // Expect transformed ref name with custom prefix to appear
    const hasCustomTransformedRef
      = /type\s+X_/.test(globalsFile) || /interface\s+X_/.test(globalsFile)

    expect(hasCustomTransformedRef).toBeTruthy()
  })
})
