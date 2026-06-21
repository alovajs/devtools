/// <reference types="node" />

import { defineConfig } from 'worma'
import { alovaGlobals } from 'worma/plugin'

/**
 * Worma 配置 — benchmark 用
 * 使用 alovaGlobals 全局式模板，生成 TypeScript API 客户端
 *
 * input/output 支持通过环境变量覆盖，用于 benchmark 动态 scale 测试：
 *   BENCHMARK_SPEC   — OpenAPI spec 文件路径
 *   BENCHMARK_OUTPUT — 生成输出目录
 *
 * 注意：input 为本地 OpenAPI 文件，不要使用 platform 插件。
 * platform 插件面向 HTTP base url（会拼接 /openapi.json 等路径），
 * 用在本地文件上会产生不存在的 url 导致生成失败。
 */
export default defineConfig({
  generator: [
    {
      input: process.env.BENCHMARK_SPEC || 'petstore.json',
      output: process.env.BENCHMARK_OUTPUT || 'output/worma',
      serverName: 'Petstore',
      docComment: false,
      plugins: [alovaGlobals()],
    },
  ],
})
