import type { Plugin } from 'vue'
import { createHead } from '@unhead/vue/client'

export const head = createHead()
export const install: Plugin = head
