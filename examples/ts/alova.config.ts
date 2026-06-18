import { defineConfig } from '@alova/wormhole'
import { aiDoc, alova, alovaGlobals, axios, fetch, ky } from '@alova/wormhole/plugin'

// For more config detailed visit:
// https://alova.js.org/tutorial/getting-started/extension-integration

export default defineConfig({
  generator: [
    {
      /**
       * file input. support:
       * 1. openapi json file url
       * 2. local file
       */
      input: 'swagger.json',

      /**
       * input file platform. Currently only swagger is supported.
       * When this parameter is specified, the input field only needs to specify the document address without specifying the openapi file
       */
      platform: 'swagger',

      docComment: false,

      /**
       * output path of interface file and type file.
       * Multiple generators cannot have the same address, otherwise the generated code will overwrite each other.
       */
      output: 'src/apiAlovaGlobals',

      plugins: [alovaGlobals()],

      /**
       * the mediaType of the generated response data. default is `application/json`
       */
      // responseMediaType: 'application/json',

      /**
       * the bodyMediaType of the generated request body data. default is `application/json`
       */
      // bodyMediaType: 'application/json',

      /**
       * type of generated code. The options are `auto/ts/typescript/module/commonjs`
       */
      // type: 'auto',

      /**
       * exported global api name, you can access the generated api globally through this name, default is `Apis`.
       * it is required when multiple generators are configured, and it cannot be repeated
       */
      // global: 'Apis',

      /**
       * filter or convert the generated api information, return an apiDescriptor, if this function is not specified, the apiDescriptor object is not converted
       */
      // handleApi: apiDescriptor => {
      //  return apiDescriptor;
      // }
    },
    {
      input: 'swagger.json',
      platform: 'swagger',
      output: 'src/apiAlovaFunctional',
      serverName: 'functional',
      plugins: [aiDoc(), alova()],
    },
    {
      input: 'swagger.json',
      platform: 'swagger',
      output: 'src/apiAxios',
      type: 'module',
      plugins: [axios()],
    },
    {
      input: 'swagger.json',
      platform: 'swagger',
      output: 'src/apiFetch',
      plugins: [fetch()],
    },
    {
      input: 'swagger.json',
      platform: 'swagger',
      output: 'src/apiKy',
      plugins: [ky()],
    },
  ],
})
