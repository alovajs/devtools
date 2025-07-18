import { defineStore } from 'pinia'

export const useRouteStore = defineStore('route', () => {
  const route = useRoute()
  const path = computed(() => route.path)
  const app = getCurrentInstance()
  watchPostEffect(() => {
    const rootDom = app?.root.vnode.el as HTMLElement | null
    if (rootDom) {
      rootDom.dataset.route = path.value
      rootDom.id = 'root'
    }
  })
  return {
    path,
  }
})
