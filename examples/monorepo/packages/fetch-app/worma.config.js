import { defineConfig } from 'wormajs'
import { fetch } from 'wormajs/plugin'

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
