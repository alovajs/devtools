import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: 'petstore.json',
  output: 'output/hey-api',
  plugins: ['@hey-api/typescript', '@hey-api/sdk', '@hey-api/client-fetch'],
})
