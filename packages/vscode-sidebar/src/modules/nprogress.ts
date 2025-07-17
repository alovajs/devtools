import type { UserModule } from '@/types'
import NProgress from 'nprogress'

export const install: UserModule = ({ isClient, router }) => {
  if (isClient) {
    router.beforeEach((to, from) => {
      // if (to.path === '/index.html') {
      //   return { path: '/' }
      // }
      if (to.path !== from.path)
        NProgress.start()
    })
    router.afterEach(() => {
      NProgress.done()
    })
  }
}
