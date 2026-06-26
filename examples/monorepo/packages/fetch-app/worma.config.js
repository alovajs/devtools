import { defineConfig } from 'worma'
import { fetch } from 'worma/plugin'

export default defineConfig({
  generator: [
    {
      input: '../../petstore.json',
      output: 'src/api/fetch',
      serverName: 'Fetch',
      plugins: [fetch()],
    },
  ],
})
