export type AlovaVersion = `v${number}`

export type FrameworkName = 'vue' | 'react'
export type ModuleType = 'commonJs' | 'ESModule'
export interface Parser<T, U, O> {
  name: string
  parse: (data: T, options: O) => Promise<U>
}

export interface Loader<T, U, O> {
  name: string
  transform: (data: T, options: O) => U
}

export * from '@/helper/config/type'
