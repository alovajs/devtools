import type { Router } from 'vue-router'
import { getWebViewUrl, isVscode } from '~/utils/vscode'

export function createVscodeGuard(router: Router) {
  if (!isVscode()) {
    return
  }
  let init = false
  router.beforeEach((to, _) => {
    const { path } = getWebViewUrl()
    if (to.path === '/' && path !== to.path && !init) {
      init = true
      return {
        path,
      }
    }
  })
}
