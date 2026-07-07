import { defineConfig } from 'wormajs'
import { alova } from 'wormajs/plugin'

export default defineConfig({
  generator: [
    {
      input: '../../petstore.json',
      output: 'src/api/alova',
      serverName: 'Alova',
      plugins: [alova()],
    },
  ],
})
