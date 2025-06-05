import { generate } from '@/index';
import { createPlugin } from '@/plugins';
import { rename } from '@/plugins/presets/rename';
import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { ApiPlugin } from '~/index';

vi.mock('node:fs');
vi.mock('node:fs/promises');
const getSalt = () => `_${Math.random().toString(36).slice(2)}`;

const generateWithPlugin = async (inputFile: string, plugins: ApiPlugin[], outputDir?: string) => {
  outputDir ??= resolve(__dirname, `./mock_output/plugin_test${getSalt()}`);
  await generate({
    generator: [{ input: inputFile, output: outputDir, plugins }]
  });

  const apiDefinitionsFile = await fs.readFile(resolve(outputDir, 'apiDefinitions.ts'), 'utf-8');
  const globalsFile = await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8');

  return { apiDefinitionsFile, globalsFile };
};

describe('plugin test', () => {
  test('should apply plugin correctly', async () => {
    const applyFn = vi.fn();
    const nullPlugin = createPlugin(() => ({
      handleApi: apiDescriptor => {
        applyFn(apiDescriptor);
        return null;
      }
    }));

    const { apiDefinitionsFile, globalsFile } = await generateWithPlugin(
      resolve(__dirname, './openapis/openapi_301.json'),
      [nullPlugin()]
    );

    expect(apiDefinitionsFile).not.toBeUndefined();
    // should generate a empty api interface
    expect(globalsFile).toMatch('interface Apis {}');
    expect(applyFn).toHaveBeenCalled();
  });
});

describe('rename plugin', () => {
  test('should rename urls to snakeCase style', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, './openapis/openapi_300.yaml'), [
      rename({ scope: 'url', style: 'snakeCase' })
    ]);

    // /pet stays as /pet (already camelCase)
    expect(apiDefinitionsFile).toContain(`['POST', '/pet']`);
    // Changes to /pet/find_by_status
    expect(apiDefinitionsFile).toContain(`['GET', '/pet/find_by_status']`);
  });

  test('should rename urls to camelCase style', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename({ scope: 'url', style: 'camelCase' })
    ]);

    expect(apiDefinitionsFile).toContain(`/userManagement`);
    expect(apiDefinitionsFile).toContain(`/orderProcessing`);
  });

  test('should apply custom transform function', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename({
        scope: 'url',
        transform: descriptor => `/custom_prefix${descriptor.url}`
      })
    ]);

    // Check for custom prefix in URLs
    expect(apiDefinitionsFile).toMatch(/custom_prefix/);
  });

  test('should only rename matched urls', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename({
        scope: 'url',
        match: 'user',
        style: 'camelCase'
      })
    ]);

    // URLs with 'user' change to camelCase
    expect(apiDefinitionsFile).toMatch(/userManagement/);

    // Other URLs stay the same
    expect(apiDefinitionsFile).toContain(`/order_processing/{order_id}`);
  });

  test('should rename parameters to camelCase', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename({ scope: 'params', style: 'camelCase' })
    ]);

    // Check for camelCase parameters
    const hasTransformedParams =
      /pageNumber/.test(globalsFile) || /includeUserDetails/.test(globalsFile) || /sortBy/.test(globalsFile);

    expect(hasTransformedParams).toBeTruthy();
  });

  test('should rename path parameters', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename({ scope: 'pathParams', style: 'camelCase' })
    ]);

    // Check for camelCase path parameters
    const hasTransformedPathParams = /{userId}/.test(globalsFile);

    expect(hasTransformedPathParams).toBeTruthy();
  });

  test('should rename request body properties', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename({ scope: 'data', style: 'camelCase' })
    ]);

    // Check for camelCase request body properties
    const hasTransformedProps =
      /userName/.test(globalsFile) || /emailAddress/.test(globalsFile) || /phoneNumber/.test(globalsFile);

    expect(hasTransformedProps).toBeTruthy();
  });

  test('should rename response properties', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename({ scope: 'response', style: 'camelCase' })
    ]);

    // Check for camelCase response properties
    const hasTransformedProps =
      /pageCount/.test(globalsFile) || /totalCount/.test(globalsFile) || /billingAddress/.test(globalsFile);

    expect(hasTransformedProps).toBeTruthy();
  });

  test('should apply multiple rename configs in sequence', async () => {
    const { apiDefinitionsFile, globalsFile } = await generateWithPlugin(
      resolve(__dirname, './openapis/naming_openapi.yaml'),
      [
        rename([
          // First make URLs snake_case
          { scope: 'url', style: 'snakeCase' },
          // Then make params camelCase
          { scope: 'params', style: 'camelCase' }
        ])
      ]
    );

    // URLs should be snake_case
    expect(apiDefinitionsFile).toMatch(/user_management/);
    expect(apiDefinitionsFile).toMatch(/order_processing/);

    // Parameters should be camelCase
    const hasTransformedParams = /pageNumber/.test(globalsFile) || /includeUserDetails/.test(globalsFile);

    expect(hasTransformedParams).toBeTruthy();
  });

  test('should convert mixed naming to consistent style', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename([
        // Change all to camelCase
        { scope: 'url', style: 'camelCase' },
        { scope: 'params', style: 'camelCase' },
        { scope: 'pathParams', style: 'camelCase' },
        { scope: 'data', style: 'camelCase' },
        { scope: 'response', style: 'camelCase' }
      ])
    ]);

    // Check if all names use camelCase
    const propsTransformed =
      /userName/.test(globalsFile) &&
      /emailAddress/.test(globalsFile) &&
      /phoneNumber/.test(globalsFile) &&
      /createTime/.test(globalsFile) &&
      /lastLoginTime/.test(globalsFile);

    const paramsTransformed =
      /pageNumber/.test(globalsFile) && /itemsPerPage/.test(globalsFile) && /sortBy/.test(globalsFile);

    expect(propsTransformed && paramsTransformed).toBeTruthy();
  });

  test('should convert all styles to snakeCase', async () => {
    const { apiDefinitionsFile, globalsFile } = await generateWithPlugin(
      resolve(__dirname, './openapis/naming_openapi.yaml'),
      [
        rename([
          // Change all to snake_case
          { scope: 'url', style: 'snakeCase' },
          { scope: 'params', style: 'snakeCase' },
          { scope: 'pathParams', style: 'snakeCase' },
          { scope: 'data', style: 'snakeCase' },
          { scope: 'response', style: 'snakeCase' }
        ])
      ]
    );

    // URLs should be snake_case
    expect(apiDefinitionsFile).toMatch(/user_management/);
    expect(apiDefinitionsFile).toMatch(/order_processing/);

    // Check if all names use snake_case
    const propsTransformed =
      /user_name/.test(globalsFile) && /email_address/.test(globalsFile) && /phone_number/.test(globalsFile);

    const paramsTransformed = /page_number/.test(globalsFile) && /items_per_page/.test(globalsFile);

    expect(propsTransformed && paramsTransformed).toBeTruthy();
  });

  test('should convert to kebabCase style', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename({ scope: 'url', style: 'kebabCase' })
    ]);

    // URLs should use kebab-case
    expect(apiDefinitionsFile).toMatch(/user-management/);
    expect(apiDefinitionsFile).toMatch(/order-processing/);
  });

  test('should convert to pascalCase style', async () => {
    const { globalsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename({ scope: 'data', style: 'pascalCase' })
    ]);

    // Properties should use PascalCase
    expect(globalsFile).toMatch(/UserName/);
    expect(globalsFile).toMatch(/EmailAddress/);
    expect(globalsFile).toMatch(/PhoneNumber/);
  });

  test('should match using regex pattern', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename({
        scope: 'url',
        match: /user|order/,
        style: 'camelCase'
      })
    ]);

    // URLs with 'user' or 'order' should change
    expect(apiDefinitionsFile).toMatch(/userManagement/);
    expect(apiDefinitionsFile).toMatch(/orderProcessing/);
  });

  test('should match using function matcher', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename({
        scope: 'url',
        match: key => key.includes('user') && !key.includes('detail'),
        style: 'camelCase'
      })
    ]);

    // Only URLs with 'user' but not 'detail' change
    expect(apiDefinitionsFile).toMatch(/userManagement/);
  });

  test('should throw error when neither style nor transform is provided', async () => {
    expect(() => {
      rename({ scope: 'url' });
    }).toThrow('at least one of `style` or `transform` is required');
  });

  test('should correctly handle path parameter placeholders', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename({
        scope: 'pathParams',
        style: 'camelCase'
      })
    ]);

    // Path parameters should be replaced correctly
    expect(apiDefinitionsFile).toMatch(/{userId}/);
    expect(apiDefinitionsFile).toMatch(/{orderId}/);
  });

  test('should apply both style and transform function', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, './openapis/naming_openapi.yaml'), [
      rename({
        scope: 'url',
        style: 'camelCase',
        transform: descriptor => `${descriptor.url}_transformed`
      })
    ]);

    // Apply transform then style
    expect(apiDefinitionsFile).toMatch(/userManagementTransformed/);
    expect(apiDefinitionsFile).toMatch(/orderProcessingTransformed/);
  });
});
