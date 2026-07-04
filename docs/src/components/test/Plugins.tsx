import Icon from './Icon'
import SectionLabel from './SectionLabel'

const plugins = [
  { name: '@plugin/rename', icon: 'edit' },
  { name: '@plugin/mock', icon: 'science' },
  { name: '@plugin/filter', icon: 'filter_list' },
  { name: '@plugin/swr', icon: 'update' },
  { name: '@plugin/zod', icon: 'verified_user' },
]

const pluginClasses = [
  'p-8 tech-border-b tech-border-r hover:bg-primary transition-all group relative',
  'p-8 tech-border-b tech-border-r hover:bg-primary transition-all group relative',
  'p-8 tech-border-b sm:tech-border-r-0 hover:bg-primary transition-all group relative',
  'p-8 tech-border-b tech-border-r sm:tech-border-b-0 hover:bg-primary transition-all group relative',
  'p-8 tech-border-b tech-border-r sm:tech-border-b-0 hover:bg-primary transition-all group relative',
]

export default function Plugins() {
  return (
    <section className="tech-border-b">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className="p-8 lg:p-12 lg:tech-border-r flex flex-col justify-center relative bg-surface">
          <SectionLabel>EXT_REGISTRY</SectionLabel>
          <h2 className="font-headline-lg text-4xl text-on-background mb-4 uppercase font-bold tracking-tighter">9 款内置插件</h2>
          <p className="font-body-md text-sm text-on-surface-variant mb-10 leading-relaxed">
            按需组合，构建属于你的定制化生成管线。通过简单的配置启用，高度可扩展。
          </p>
          <a className="inline-flex items-center gap-3 text-primary hover:text-white transition-colors font-data-mono text-xs uppercase tracking-widest" href="#">
            查看全部插件 <Icon name="arrow_forward" className="text-sm" />
          </a>
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3">
          {plugins.map((plugin, index) => (
            <div key={plugin.name} className={pluginClasses[index]}>
              <span className="text-on-surface group-hover:text-black font-data-mono text-xs block mb-4">{plugin.name}</span>
              <div className="w-6 h-6 tech-border border-outline group-hover:border-black flex items-center justify-center">
                <Icon name={plugin.icon} className="text-sm group-hover:text-black" />
              </div>
            </div>
          ))}
          <div className="p-8 hover:bg-primary transition-all group flex items-center justify-center cursor-pointer">
            <span className="text-on-surface-variant group-hover:text-black font-data-mono text-xs font-bold tracking-widest uppercase">+4 MORE</span>
          </div>
        </div>
      </div>
    </section>
  )
}
