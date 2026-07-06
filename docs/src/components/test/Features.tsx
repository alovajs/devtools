const features = [
  {
    num: '01',
    tag: 'OUTPUTS',
    title: '4 种产物',
    desc: '同时生成运行时代码、TS 类型定义、Markdown 文档，及 AI 优化知识库。',
  },
  {
    num: '02',
    tag: 'DESIGN',
    title: '通用设计',
    desc: '底层抽象提供最大兼容性，轻松适配主流前端及后端生态。',
  },
  {
    num: '03',
    tag: 'CONTROL',
    title: '灵活可控',
    desc: '精细配置文件，自定义路径、命名、拦截逻辑，满足复杂工程。',
  },
  {
    num: '04',
    tag: 'DX',
    title: '编辑器文档',
    desc: '类型自带完整 JSDoc，VSCode 悬浮即可查阅接口描述与示例。',
  },
]

const featureClasses = [
  'p-8 md:tech-border-r tech-border-b lg:tech-border-b-0 hover:bg-surface-variant/30 transition-colors relative group',
  'p-8 md:tech-border-r-0 lg:tech-border-r tech-border-b lg:tech-border-b-0 hover:bg-surface-variant/30 transition-colors relative group',
  'p-8 md:tech-border-r tech-border-b md:tech-border-b-0 hover:bg-surface-variant/30 transition-colors relative group',
  'p-8 hover:bg-surface-variant/30 transition-colors relative group',
]

export default function Features() {
  return (
    <section className="tech-border-b">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <div key={feature.num} className={featureClasses[index]}>
            <div className="absolute top-0 right-0 p-2 text-[9px] text-outline font-data-mono group-hover:text-primary">
              0x0
              {feature.num}
            </div>
            <div className="font-data-mono text-[10px] text-primary mb-6 uppercase tracking-[0.3em]">
              {feature.num}
              {' '}
              //
              {' '}
              {feature.tag}
            </div>
            <h3 className="font-headline-lg text-2xl text-on-background mb-4 uppercase font-bold tracking-tight">{feature.title}</h3>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
