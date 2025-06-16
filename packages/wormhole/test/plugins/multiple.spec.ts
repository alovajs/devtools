import { apiFilter, rename, tagModifier } from '@/plugins';
import { resolve } from 'node:path';
import { generateWithPlugin } from '../util';

vi.mock('node:fs');
vi.mock('node:fs/promises');
describe('multiple plugin', () => {
  test('should rename urls to snakeCase style', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/openapi_300.yaml'), [
      apiFilter([{ exclude: 'user' }]),
      rename({ scope: 'url', style: 'snakeCase' }),
      tagModifier(tag => tag?.toUpperCase())
    ]);

    // /pet stays as /pet (already camelCase)
    expect(apiDefinitionsFile).toContain(`['POST', '/pet']`);
    // Changes to /pet/find_by_status
    expect(apiDefinitionsFile).toContain(`['GET', '/pet/find_by_status']`);
    // `user` is filtered out
    expect(apiDefinitionsFile).not.toContain(`['POST', '/user/create_with_array']`);
    // tag should be uppercase
    expect(apiDefinitionsFile).toContain(`PET.updatePet`);
    expect(apiDefinitionsFile).toContain(`STORE.getOrderById`);
    expect(apiDefinitionsFile).not.toContain(`USER.login`);
  });
});
