/// <reference types="node" />

import { defineConfig } from 'wormajs'
import { alovaGlobals, axios } from 'wormajs/plugin'

/**
 * Worma 配置 — benchmark 用
 * 通过环境变量动态切换模板：
 *   BENCHMARK_SPEC     — OpenAPI spec 文件路径
 *   BENCHMARK_OUTPUT   — 生成输出目录
 *   BENCHMARK_TEMPLATE — 模板名: 'alovaGlobals' | 'axios'（默认 alovaGlobals）
 */
const template = process.env.BENCHMARK_TEMPLATE || 'alovaGlobals'

export default defineConfig({
  generator: [
    {
      input: process.env.BENCHMARK_SPEC || 'petstore.json',
      output: process.env.BENCHMARK_OUTPUT || 'output/worma',
      serverName: 'Petstore',
      docComment: false,
      plugins: [template === 'axios' ? axios() : alovaGlobals()],
    },
  ],
})
