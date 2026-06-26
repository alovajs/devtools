import { defineConfig } from 'worma'
import { axios } from 'worma/plugin'

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
