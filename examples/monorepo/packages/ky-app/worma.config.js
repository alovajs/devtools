import { defineConfig } from 'wormajs'
import { ky } from 'wormajs/plugin'

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
