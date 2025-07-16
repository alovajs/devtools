import type { Dispose } from '@jsonrpc-rx/client'
import { onMounted, onUnmounted } from 'vue'
import { useHandlers } from './use-handlers'

export interface FileDocument {
  readonly uri: string
  readonly fileName: string
}

const handlers = useHandlers()

// 监听工作空间的某个文件的打开
export function useOnDidOpenTextDocument(listener: (file: FileDocument) => void) {
  let dispose: Dispose
  onMounted(async () => {
    dispose = await handlers.onDidOpenTextDocument({
      next: listener as any,
    })
  })

  onUnmounted(() => {
    dispose?.()
  })
}
