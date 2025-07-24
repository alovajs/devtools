import type { Plugin } from 'vue'
import { createApp } from 'vue'
import App from './App.vue'
import 'uno.css'
import '~/styles/main.css'

const app = createApp(App)

Object.values(import.meta.glob<{ install: Plugin }>(['./plugins/*.ts', './plugins/*/index.ts'], { eager: true }))
  .forEach((i) => {
    if (i.install) {
      app.use(i.install)
    }
  })
app.mount('#app')
