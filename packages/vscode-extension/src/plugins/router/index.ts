import type { Plugin } from 'vue'
import { setupLayouts } from 'virtual:generated-layouts'
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { isVscode } from '~/utils'
import { createRouterGuard } from './guard'

const router = createRouter({
  history: isVscode() ? createMemoryHistory() : createWebHistory(),
  routes: setupLayouts(routes),
})

createRouterGuard(router)

const install: Plugin = router

export {
  install,
  router,
}
