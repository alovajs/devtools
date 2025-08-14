import type { UserConfig, UserConfigExport, UserConfigFn, UserConfigFnObject, UserConfigFnPromise } from '@/type'

/**
 * Type helper to make it easier to use alova.config.ts
 * accepts a direct {@link UserConfig} object, or a function that returns it.
 */
export function defineConfig(config: UserConfig): UserConfig
export function defineConfig(config: Promise<UserConfig>): Promise<UserConfig>
export function defineConfig(config: UserConfigFnObject): UserConfigFnObject
export function defineConfig(config: UserConfigFnPromise): UserConfigFnPromise
export function defineConfig(config: UserConfigFn): UserConfigFn
export function defineConfig(config: UserConfigExport): UserConfigExport
export function defineConfig(config: UserConfigExport): UserConfigExport {
  return config
}
