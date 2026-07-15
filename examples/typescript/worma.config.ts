import { defineConfig } from 'wormajs'
import { aiDoc, alovaGlobals, swagger } from 'wormajs/plugin'

// ─── Worma TypeScript 示例 ──────────────────────────
// 本文件展示了单项目中配置 5 个 generator 的方式，
// 一次性生成多套模板代码，方便对比选择。
//
// 运行 `pnpm gen` 即可生成所有 API 客户端代码。

export default defineConfig({
  generator: [

    /* ───── ② alovaGlobals 全局式模板 ─────
     *   • 所有 API 挂在全局对象 MyApis 上
     *   • 无需 import，直接 MyApis.getPetById() 调用
     */
    {
      output: 'src/api/alova-globals',
      serverName: 'Alova Globals',
      plugins: [
        swagger('C:/Users/Administrator/Desktop/api-docs.json'),
        alovaGlobals({ global: 'MyApis' }),
        aiDoc(),
      ],
    },
  ],
})
