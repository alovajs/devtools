import { defineConfig } from 'wormajs'
import { axios } from 'wormajs/plugin'

export default defineConfig({
  generator: [
    {
      input: '../../petstore.json',
      output: 'src/api/axios',
      serverName: 'Axios',
      plugins: [axios()],
    },
  ],
})
