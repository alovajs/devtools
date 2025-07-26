import type { Router } from 'vue-router'
import NProgress from 'nprogress'

export function createProgressGuard(router: Router) {
  router.beforeEach((to, from) => {
    if (to.path !== from.path)
      NProgress.start()
  })
  router.afterEach(() => {
    NProgress.done()
  })
}
