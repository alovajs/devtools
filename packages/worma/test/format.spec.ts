import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import { vol } from 'memfs'
import { setGlobalConfig } from '@/config'
import { generate } from '@/index'
import { alovaGlobals } from '@/plugins'
import { defaultFormatOptions, format, isFormatEnabled } from '@/utils/format'

vi.mock('node:fs')
vi.mock('node:fs/promises')

const resetFormat = () => setGlobalConfig({ format: undefined })

const INPUT = resolve(__dirname, './openapis/openapi_301.json')

beforeEach(() => {
  vol.reset()
  vol.mkdirSync(process.cwd(), { recursive: true })
})

async function generateWithFormat(formatConfig?: Record<string, unknown>, outputSuffix = '') {
  const outputDir = resolve(__dirname, `./mock_output/format${outputSuffix}`)
  vol.mkdirSync(outputDir, { recursive: true })
  const results = await generate({
    format: formatConfig,
    generator: [{ input: INPUT, output: outputDir, type: 'ts', plugins: [alovaGlobals()] }],
  } as any)
  expect(results).toStrictEqual([true])
  return fs.readFile(resolve(outputDir, 'apiDefinitions.ts'), 'utf-8')
}

describe('format (oxfmt)', () => {
  afterEach(resetFormat)

  it('默认值与历史 prettier 配置等价，endOfLine 固定为 lf', () => {
    expect(defaultFormatOptions).toMatchObject({
      printWidth: 120,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: true,
      trailingComma: 'none',
      bracketSpacing: true,
      bracketSameLine: true,
      arrowParens: 'avoid',
      singleAttributePerLine: true,
      vueIndentScriptAndStyle: false,
      endOfLine: 'lf',
    })
    // prettier 的 insertPragma 在 oxfmt 中不存在，不应再传递
    expect(defaultFormatOptions).not.toHaveProperty('insertPragma')
  })

  it('应用默认参数：单引号、无尾逗号、单参数箭头省略括号', async () => {
    const code = await format('demo.ts', 'const f = (a) => {\nreturn "x"\n}\n')
    expect(code).toContain('\'x\'')
    expect(code).toContain('a =>')
    expect(code).not.toMatch(/,\s*[)\]]/)
  })

  it('endOfLine 默认输出 lf，不产生 crlf', async () => {
    const code = await format('demo.ts', 'const a=1')
    expect(code.endsWith('\n')).toBe(true)
    expect(code).not.toContain('\r\n')
  })

  it('按文件扩展名推断语言，而非固定 parser', async () => {
    expect(await format('demo.json', '{"a":1}')).toBe('{ "a": 1 }\n')
    expect(await format('demo.ts', 'export const a = 1')).toBe('export const a = 1;\n')
  })

  it('用户自定义配置生效', async () => {
    setGlobalConfig({ format: { singleQuote: false, semi: false } })
    const code = await format('demo.ts', 'const a = "x";')
    expect(code).toContain('"x"')
    expect(code).not.toContain(';')
  })

  it('单次调用的覆盖优先于全局配置', async () => {
    setGlobalConfig({ format: { semi: false } })
    const code = await format('demo.ts', 'const a=1', { semi: true })
    expect(code).toContain(';')
  })

  it('解析失败时抛错，交由调用方回退原文', async () => {
    await expect(format('demo.ts', 'const a = {{{')).rejects.toThrow(/oxfmt/)
  })
})

describe('isFormatEnabled', () => {
  afterEach(resetFormat)

  it('未配置 format.enabled 时默认 true', () => {
    expect(isFormatEnabled()).toBe(true)
  })

  it('format.enabled 控制是否格式化', () => {
    setGlobalConfig({ format: { enabled: false } })
    expect(isFormatEnabled()).toBe(false)

    setGlobalConfig({ format: { enabled: true } })
    expect(isFormatEnabled()).toBe(true)
  })
})

describe('generate 集成：顶层 format 配置', () => {
  afterEach(resetFormat)

  it('自定义参数透传到生成产物', async () => {
    const withSemi = await generateWithFormat(undefined, '_default')
    const withoutSemi = await generateWithFormat({ semi: false }, '_nosemi')

    expect(withSemi).toContain(';')
    expect(withoutSemi).not.toContain(';')
  })

  it('format.enabled 为 false 时跳过格式化', async () => {
    const formatted = await generateWithFormat(undefined, '_enabled')
    const raw = await generateWithFormat({ enabled: false }, '_disabled')

    expect(raw).not.toBe(formatted)
  })

  it('不传 format 时保持默认格式化行为', async () => {
    const content = await generateWithFormat(undefined, '_baseline')
    // 默认 singleQuote: true，字符串常量应使用单引号
    expect(content).not.toContain('"')
  })
})
