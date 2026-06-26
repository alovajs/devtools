import { defineConfig } from 'worma'
import { ky } from 'worma/plugin'

export default defineConfig({
  generator: [
    {
      input: '../../petstore.json',
      output: 'src/api/ky',
      serverName: 'Ky',
      plugins: [ky()],
    },
  ],
})
