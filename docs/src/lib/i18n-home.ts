import type { Locale } from './i18n'

/**
 * 首页（landing page）文案字典。
 *
 * 首页为自定义 React 组件，不走 MDX，因此单独维护一份字典。
 * 每个 section 组件通过 `lang` prop 取出对应语言的对象。
 * 翻译以「正式、前端开发者易读」为准则，避免生僻表达。
 */
export interface HomeDict {
  metaTitle: string
  hero: {
    loading: string
    titleLine1: string
    titleLine2a: string
    titleLine2b: string
    subtitle: string
    agentInstall: string
    quickStart: string
    tryNow: string
  }
  features: {
    items: { tag: string, title: string, desc: string }[]
  }
  processFlow: {
    heading: string
    input: string
    artifacts: { code: string, types: string, docs: string, skill: string }
  }
  ideEditor: {
    sectionLabel: string
    title: string
    desc: string
    docLink: string
    tabs: {
      apiExplorer: { label: string, desc: string }
      hoverDocs: { label: string, desc: string }
      quickInsert: { label: string, desc: string }
      portal: { label: string, desc: string }
      autoDetect: { label: string, desc: string }
      jsIntelliSense: { label: string, desc: string }
    }
    endpointsHeader: string
    selectEndpoint: string
    paramsTitle: string
    responsesTitle: string
    colName: string
    colIn: string
    colType: string
    colRequired: string
    colDescription: string
    searchPlaceholder: string
    noResults: string
    watching: string
    watchConfig: string
    scanInterval: string
    openApiPath: string
    outputDir: string
    lastCheck: string
    justNow: string
    viewApiSources: string
    jsDesc: string
    jsHint: string
    clickToExplorer: string
    clickToExplorerTab: string
  }
  matrix: {
    title: string
    desc: string
    customTemplate: string
  }
  plugins: {
    title: string
    desc: string
    viewAll: string
    items: { name: string, desc: string }[]
  }
  changeLog: {
    sectionLabel: string
    label: string
    title: string
    punch: string
    desc: string
    what: string
    why: string
    docLink: string
    genCommand: string
    recordedLine: string
    hint: string
    diffCommand: string
    changeId: string
    timestamp: string
    groupTitle: string
    latest: string
    columns: { type: string, target: string, change: string, level: string }
    affectsLabel: string
    totals: { label: string, added: string, removed: string, modified: string }
  }
  cta: {
    title: string
    agentInstall: string
    quickStart: string
    github: string
    hint: string
  }
  footer: {
    resources: string
    project: string
    community: string
    links: {
      documentation: string
      contributing: string
      examples: string
      changelog: string
      releases: string
      coreEngine: string
      github: string
      wechat: string
    }
  }
  contributors: {
    sectionLabel: string
    headerLabel: string
    title: string
    desc: string
    total: string
  }
}

const en: HomeDict = {
  metaTitle: 'worma - One OpenAPI, from humans to AI',
  hero: {
    loading: 'SYSTEM_INIT // LOADING',
    titleLine1: 'One OpenAPI',
    titleLine2a: 'From Humans',
    titleLine2b: 'to AI',
    subtitle:
      'Generate type-safe API client code for developers and AI-readable API knowledge for agents. One spec, consistent contracts, faster collaboration.',
    agentInstall: 'Install By Agent',
    quickStart: 'Quick Start',
    tryNow: 'Try it now',
  },
  features: {
    items: [
      {
        tag: 'OUTPUTS',
        title: '4 Artifacts',
        desc: 'Generate runtime code, TypeScript types, Markdown docs, and an AI-optimized knowledge base in one pass.',
      },
      {
        tag: 'DESIGN',
        title: 'Universal Design',
        desc: 'Low-level abstractions maximize compatibility, fitting seamlessly into mainstream frontend and backend ecosystems.',
      },
      {
        tag: 'CONTROL',
        title: 'Full Control',
        desc: 'Fine-grained config to customize paths, naming, and interceptors for complex projects.',
      },
      {
        tag: 'DX',
        title: 'Editor Docs',
        desc: 'Types ship with full JSDoc, so you can hover in VS Code to see API descriptions and examples.',
      },
    ],
  },
  processFlow: {
    heading: 'From OpenAPI to Production Code',
    input: 'Deliver OpenAPI',
    artifacts: { code: 'Code', types: 'Types', docs: 'Docs', skill: 'AI Skill' },
  },
  ideEditor: {
    sectionLabel: '07 // INTEGRATION',
    title: 'Deep IDE Integration',
    desc: 'Get a full overview of your APIs right inside your editor. Strong type inference and hover docs make every API call unambiguous.',
    docLink: 'View Docs',
    tabs: {
      apiExplorer: { label: 'API Explorer', desc: 'Browse all API endpoints visually' },
      hoverDocs: { label: 'Hover Docs', desc: 'Hover to view API documentation' },
      quickInsert: { label: 'Quick Insert', desc: 'Insert API call snippets in one click' },
      portal: { label: 'Portal', desc: 'Jump between code and API docs' },
      autoDetect: { label: 'Auto Detect', desc: 'Detect OpenAPI file changes automatically' },
      jsIntelliSense: { label: 'JS IntelliSense', desc: 'Full type inference and smart completions' },
    },
    endpointsHeader: 'API Endpoints',
    selectEndpoint: 'Select an endpoint to view details',
    paramsTitle: 'Parameters',
    responsesTitle: 'Responses',
    colName: 'Name',
    colIn: 'In',
    colType: 'Type',
    colRequired: 'Required',
    colDescription: 'Description',
    searchPlaceholder: 'Search snippets...',
    noResults: 'No results',
    watching: 'Watching OpenAPI file changes...',
    watchConfig: 'Watch Config',
    scanInterval: 'Scan interval',
    openApiPath: 'OpenAPI path',
    outputDir: 'Output dir',
    lastCheck: 'Last check',
    justNow: 'Just now',
    viewApiSources: 'View Api: getPetById (5 sources)',
    jsDesc: 'Every .js file ships with a .d.ts declaration for full type safety.',
    jsHint: 'Full type inference: path params, query, body, and response',
    clickToExplorer: '// Click the button below to jump to the API Explorer',
    clickToExplorerTab: '// The "View Api" button jumps to the API Explorer tab above',
  },
  matrix: {
    title: 'Compatibility Matrix',
    desc: 'Cross-stack adaptation, seamlessly connected. Generate client code for multiple request libraries from mainstream backend languages in one click.',
    customTemplate: 'Custom Templates',
  },
  plugins: {
    title: 'Plugin System',
    desc: 'Powerful plugins for smarter generation.',
    viewAll: 'View all plugins',
    items: [
      { name: 'aiDoc', desc: 'AI-generated docs and prompts.' },
      { name: 'rename', desc: 'Smart renaming for APIs, fields, and params.' },
      { name: 'apiFilter', desc: 'Filter APIs by tag and generate on demand.' },
      { name: 'swagger', desc: 'Auto-assemble OpenAPI URLs from Swagger UI.' },
      { name: 'knife4j', desc: 'Auto-assemble OpenAPI URLs from Knife4j.' },
      { name: 'yapi', desc: 'Import projects from YApi (cookie required).' },
      { name: 'postman', desc: 'Import collections from Postman (API Key required).' },
      { name: 'apifox', desc: 'Auto-import projects from Apifox' },
      { name: 'payloadModifier', desc: 'Add, remove, and modify API parameter types' },
    ],
  },
  changeLog: {
    sectionLabel: 'CHANGE_LOG_V1',
    label: '06 // CHANGE_TRACKING',
    title: 'Change Records',
    punch: 'See what changed, the moment you generate.',
    desc: 'Every run diffs your OpenAPI source and lists what was added, removed or modified — down to operations, parameters and schema fields — so you can judge the impact at a glance and keep frontend code in step with the API.',
    what: 'Diffed on every generate, listed line by line',
    why: 'Impact up front, clients always in sync',
    docLink: 'View change record docs',
    genCommand: '$ worma gen',
    recordedLine: '✔ Changes recorded: 0007 (+1/-1/~3)',
    hint: 'Run `worma diff latest` to view the details.',
    diffCommand: '$ worma diff latest',
    changeId: 'Change 0007',
    timestamp: '2026-09-11 14:32:08',
    groupTitle: 'src/api  (petstore)',
    latest: 'latest',
    columns: { type: 'TYPE', target: 'TARGET', change: 'CHANGE', level: 'LEVEL' },
    affectsLabel: 'affects',
    totals: { label: 'Total', added: 'added', removed: 'removed', modified: 'modified' },
  },
  cta: {
    title: 'Get Started',
    agentInstall: 'Install By Agent',
    quickStart: 'Quick Start',
    github: 'GitHub',
    hint: 'Send the prompt above to your coding agent to set up and configure worma in no time.',
  },
  footer: {
    resources: 'Resources',
    project: 'Project',
    community: 'Community',
    links: {
      documentation: 'Documentation',
      contributing: 'Contributing',
      examples: 'Examples',
      changelog: 'Changelog',
      releases: 'Releases',
      coreEngine: 'Core Engine',
      github: 'GitHub',
      wechat: 'WeChat Group',
    },
  },
  contributors: {
    sectionLabel: 'CONTRIBUTORS // BETA_PHASE',
    headerLabel: '// Community Contributors',
    title: 'Beta Contributors',
    desc: 'worma is still in beta. The following folks helped shape, build, and validate it early on. Every contribution, big or small, keeps the wormhole flowing.',
    total: 'CONTRIBUTORS',
  },
}

const zh: HomeDict = {
  metaTitle: 'worma - 一份 OpenAPI，从人类到 AI',
  hero: {
    loading: 'SYSTEM_INIT // 加载中',
    titleLine1: '一份 OpenAPI',
    titleLine2a: '从人类到',
    titleLine2b: 'AI',
    subtitle: '为你生成类型安全的接口代码，为 AI 生成易理解的接口知识。统一规范，加速协同。',
    agentInstall: 'agent 安装',
    quickStart: '快速开始',
    tryNow: '即刻体验',
  },
  features: {
    items: [
      {
        tag: 'OUTPUTS',
        title: '4 种产物',
        desc: '同时生成运行时代码、TS 类型定义、Markdown 文档，及 AI 优化知识库。',
      },
      {
        tag: 'DESIGN',
        title: '通用设计',
        desc: '底层抽象提供最大兼容性，轻松适配主流前端及后端生态。',
      },
      {
        tag: 'CONTROL',
        title: '灵活可控',
        desc: '精细配置文件，自定义路径、命名、拦截逻辑，满足复杂工程。',
      },
      {
        tag: 'DX',
        title: '编辑器文档',
        desc: '类型自带完整 JSDoc，VSCode 悬浮即可查阅接口描述与示例。',
      },
    ],
  },
  processFlow: {
    heading: '从 OpenAPI 到生产代码',
    input: '交付 OpenAPI',
    artifacts: { code: '代码', types: '类型', docs: '文档', skill: 'AI Skill' },
  },
  ideEditor: {
    sectionLabel: '07 // INTEGRATION',
    title: 'IDE 级深度集成',
    desc: '在你的开发环境中直接获得上帝视角。强大的类型推导与悬浮文档，让 API 调用不再盲目。',
    docLink: '前往文档中心',
    tabs: {
      apiExplorer: { label: 'API 资源管理器', desc: '可视化浏览所有 API 端点' },
      hoverDocs: { label: '悬浮文档', desc: '悬浮鼠标即可查看 API 文档' },
      quickInsert: { label: '快速插入', desc: '一键插入 API 调用代码' },
      portal: { label: '传送门', desc: '代码与 API 文档联动跳转' },
      autoDetect: { label: '自动检测', desc: '自动检测 OpenAPI 文件变更' },
      jsIntelliSense: { label: 'JS IntelliSense', desc: '完整的类型推导与智能提示' },
    },
    endpointsHeader: 'API 端点',
    selectEndpoint: '选择一个端点以查看详情',
    paramsTitle: '参数',
    responsesTitle: '响应',
    colName: '名称',
    colIn: '位置',
    colType: '类型',
    colRequired: '必填',
    colDescription: '描述',
    searchPlaceholder: '搜索代码片段...',
    noResults: '无结果',
    watching: '监听 OpenAPI 文件变更中...',
    watchConfig: '检测配置',
    scanInterval: '扫描间隔',
    openApiPath: 'OpenAPI 路径',
    outputDir: '输出目录',
    lastCheck: '上次检测',
    justNow: '刚刚',
    viewApiSources: '查看 API：getPetById（5 个来源）',
    jsDesc: '每个 .js 文件都配有 .d.ts 声明文件，确保完整的类型安全。',
    jsHint: '完整的类型推导：路径参数、查询、请求体与响应',
    clickToExplorer: '// 点击下方按钮跳转到 API Explorer',
    clickToExplorerTab: '// View Api 按钮上方跳转到 API Explorer 标签页',
  },
  matrix: {
    title: '适配矩阵',
    desc: '跨端适配，无缝连接。支持从主流后端语言一键生成多种前端请求库代码。',
    customTemplate: '自定义模板',
  },
  plugins: {
    title: '插件系统',
    desc: '强大的插件。更智能的生成。',
    viewAll: '查看全部插件',
    items: [
      { name: 'aiDoc', desc: 'AI 提供文档和提示词。' },
      { name: 'rename', desc: '为 API、字段和参数提供最佳重命名。' },
      { name: 'apiFilter', desc: '按标签筛选 API，按需生成。' },
      { name: 'swagger', desc: '从 Swagger UI 自动拼装 OpenAPI 地址。' },
      { name: 'knife4j', desc: '从 Knife4j 服务自动拼装 OpenAPI 地址。' },
      { name: 'yapi', desc: '导入 YApi 项目（需登录 cookie）。' },
      { name: 'postman', desc: '导入 Postman 集合（需 API Key）。' },
      { name: 'apifox', desc: '自动导入 Apifox 中的项目' },
      { name: 'payloadModifier', desc: '增加、删除和修改 API 的参数类型' },
    ],
  },
  changeLog: {
    sectionLabel: 'CHANGE_LOG_V1',
    label: '06 // CHANGE_TRACKING',
    title: '更新记录',
    punch: '接口变了什么，生成时就知道。',
    desc: '每次生成自动比对 OpenAPI，逐条列出新增、删除与修改的接口、参数和字段；变更影响一屏看清，前端代码与接口不再脱节。',
    what: '生成即比对，变更逐条列清',
    why: '影响早知道，同步不掉队',
    docLink: '查看变更记录文档',
    genCommand: '$ worma gen',
    recordedLine: '✔ Changes recorded: 0007 (+1/-1/~3)',
    hint: 'Run `worma diff latest` to view the details.',
    diffCommand: '$ worma diff latest',
    changeId: 'Change 0007',
    timestamp: '2026-09-11 14:32:08',
    groupTitle: 'src/api  (petstore)',
    latest: 'latest',
    columns: { type: '类型', target: '目标', change: '变更', level: '级别' },
    affectsLabel: 'affects',
    totals: { label: '合计', added: '新增', removed: '删除', modified: '修改' },
  },
  cta: {
    title: '「开始使用」',
    agentInstall: 'agent 安装',
    quickStart: '快速开始',
    github: 'GitHub',
    hint: '将上方 Prompts 发送给你的 Coding Agent，快速完成 worma 安装与配置',
  },
  footer: {
    resources: '资源',
    project: '项目',
    community: '社区',
    links: {
      documentation: '文档',
      contributing: '贡献指南',
      examples: '示例',
      changelog: '更新日志',
      releases: '发布',
      coreEngine: '核心引擎',
      github: 'GitHub',
      wechat: '微信群',
    },
  },
  contributors: {
    sectionLabel: 'CONTRIBUTORS // BETA_PHASE',
    headerLabel: '// 社区贡献者',
    title: 'BETA 贡献者',
    desc: 'worma 仍处于 beta 阶段，以下伙伴参与了早期的设计、开发与验证。每一项贡献，无论大小，都让虫洞连接更通畅。',
    total: 'CONTRIBUTORS',
  },
}

export const homeDict: Record<Locale, HomeDict> = { en, zh }

export function getHomeDict(locale: Locale): HomeDict {
  return homeDict[locale]
}
