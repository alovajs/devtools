import type { Plugin } from 'vue'
import { createPinia } from 'pinia'
import piniaAllPlugin from './plugins'

export const pinia = createPinia().use(piniaAllPlugin)

export const install: Plugin = pinia
