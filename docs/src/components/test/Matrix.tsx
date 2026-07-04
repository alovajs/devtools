import Icon from './Icon'
import SectionHeader from './SectionHeader'
import SectionLabel from './SectionLabel'

const sourceLangs = ['Java', 'Go', 'Python', 'Node.js']
const outputLibs = ['alova', 'axios', 'ky', 'fetch']

export default function Matrix() {
  return (
    <section className="tech-border-b bg-background relative overflow-hidden">
      <SectionLabel>ADAPTATION_MATRIX_V1</SectionLabel>
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-4 p-8 lg:p-12 lg:tech-border-r flex flex-col justify-center relative">
          <SectionHeader label="06 // COMPATIBILITY" title="适配矩阵" />
          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed mt-6">
            跨端适配，无缝连接。支持从主流后端语言一键生成多种前端请求库代码。
          </p>
        </div>
        <div className="lg:col-span-8 p-8 lg:p-12 bg-surface/30 flex items-center justify-center">
          <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-3xl gap-8">
            <div className="flex flex-col gap-2 w-32">
              {sourceLangs.map(lang => (
                <div key={lang} className="p-2 tech-border bg-background text-center font-data-mono text-[10px] text-on-surface-variant">{lang}</div>
              ))}
            </div>
            <div className="relative flex items-center justify-center">
              <div className="hidden md:block absolute -left-12 w-12 h-[1px] bg-outline" />
              <div className="w-20 h-20 tech-border border-primary flex flex-col items-center justify-center bg-background relative group">
                <Icon name="sync_alt" className="text-primary text-2xl" />
                <span className="text-[8px] text-primary font-data-mono mt-1">CORE</span>
              </div>
              <div className="hidden md:block absolute -right-12 w-12 h-[1px] bg-outline" />
            </div>
            <div className="grid grid-cols-2 gap-2 w-48">
              {outputLibs.map((lib, index) => (
                <div
                  key={lib}
                  className={`p-2 tech-border bg-background text-center font-data-mono text-[10px] ${index === 0 ? 'text-primary' : 'text-on-surface-variant'}`}
                >
                  {lib}
                </div>
              ))}
              <div className="col-span-2 p-2 tech-border bg-primary/10 border-primary/30 text-center font-data-mono text-[10px] text-primary">自定义模板</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
