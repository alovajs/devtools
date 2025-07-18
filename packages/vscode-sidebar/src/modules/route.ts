import type { UserModule } from '@/types'
import { getWebViewRootRoutePath } from '@/utils/join-webview-uri'
// https://github.com/antfu/vite-plugin-pwa#automatic-reload-when-new-content-available
export const install: UserModule = ({ isClient, router }) => {
  if (!isClient)
    return
  router.beforeEach((to) => {
    const rootPath = getWebViewRootRoutePath()
    if (to.path === '/' && rootPath !== '/') {
      return { path: rootPath }
    }
  })
}
