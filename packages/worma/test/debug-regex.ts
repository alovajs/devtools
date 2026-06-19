import { createStrReg } from './util'

const pattern = `
       * **Response**
       * \`\`\`ts
       * type Response = Blob
       * \`\`\`
       */
      generateCase1<Config extends Alova2MethodConfig<Blob> & {
          params: {
            codegenOptionsURL: string;
          };
        }
      }>(
        config: Config
      ): Alova2Method<Blob, 'clients.generateCase1', Config>;`

const re = createStrReg(pattern)
console.log('Regex:', re)

// Actual output from debug
const actual = `
      generateCase1<
        Config extends Alova2MethodConfig<Blob> & {
          params: {
            codegenOptionsURL: string;
          };
        }
      >(
        config: Config
      ): Alova2Method<Blob, 'clients.generateCase1', Config>;`

console.log('Matches:', re.test(actual))
console.log('Match result:', actual.match(re))
