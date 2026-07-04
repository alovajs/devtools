import CornerPlus from './CornerPlus'
import Icon from './Icon'
import SectionHeader from './SectionHeader'

export default function IdeEditor() {
  return (
    <section className="tech-border-b bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-4 p-8 lg:p-12 lg:tech-border-r flex flex-col justify-center relative">
          <CornerPlus />
          <SectionHeader label="05 // INTEGRATION" title="IDE 级深度集成" className="mb-6" />
          <p className="font-body-md text-sm text-on-surface-variant mb-8 leading-relaxed">
            在你的开发环境中直接获得上帝视角。强大的类型推导与悬浮文档，让 API 调用不再盲目。
          </p>
          <div className="flex flex-col gap-2 mb-8">
            <div className="p-3 tech-border border-primary bg-primary/5 cursor-pointer group transition-all">
              <div className="flex items-center justify-between">
                <span className="font-headline-lg text-xs text-primary font-bold uppercase tracking-wider">侧边栏</span>
                <Icon name="radio_button_checked" className="text-primary text-xs" />
              </div>
              <div className="font-data-mono text-[10px] text-on-surface-variant mt-1">直接展示 API 树</div>
            </div>
            <div className="p-3 tech-border border-outline-variant hover:border-outline transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <span className="font-headline-lg text-xs text-on-surface font-bold uppercase tracking-wider group-hover:text-primary">传送门</span>
                <Icon name="radio_button_unchecked" className="text-outline-variant text-xs group-hover:text-primary" />
              </div>
              <div className="font-data-mono text-[10px] text-on-surface-variant mt-1">...</div>
            </div>
            <div className="p-3 tech-border border-outline-variant hover:border-outline transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <span className="font-headline-lg text-xs text-on-surface font-bold uppercase tracking-wider group-hover:text-primary">自动检测</span>
                <Icon name="radio_button_unchecked" className="text-outline-variant text-xs group-hover:text-primary" />
              </div>
              <div className="font-data-mono text-[10px] text-on-surface-variant mt-1">每隔 5 分钟自动检测 OpenAPI 文件</div>
            </div>
          </div>
          <div className="mt-auto">
            <button className="flex items-center gap-2 group text-primary font-data-mono text-xs uppercase tracking-widest">
              <span className="p-2 border border-primary group-hover:bg-primary group-hover:text-black transition-all">
                <Icon name="open_in_new" className="text-sm" />
              </span>
              前往文档中心
            </button>
          </div>
        </div>
        <div className="lg:col-span-8 p-6 lg:p-12 bg-surface-variant/50 relative overflow-hidden min-h-[500px] flex items-center justify-center">
          <div className="w-full max-w-3xl tech-border bg-editor-bg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-editor-titlebar tech-border-b">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-window-control" />
                <div className="w-2.5 h-2.5 rounded-full bg-window-control" />
                <div className="w-2.5 h-2.5 rounded-full bg-window-control" />
              </div>
              <div className="text-[10px] font-data-mono text-on-surface-variant">src/services/user.service.ts — Visual Studio Code</div>
              <div className="w-10" />
            </div>
            <div className="flex flex-1 min-h-[360px]">
              <div className="w-40 tech-border-r bg-editor-sidebar hidden sm:flex flex-col p-3 gap-2">
                <div className="text-[9px] font-data-mono text-outline uppercase mb-2">Explorer</div>
                <div className="flex items-center gap-2 text-on-surface-variant text-[10px]">
                  <Icon name="folder" className="text-sm opacity-50" /> src
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant text-[10px] pl-2">
                  <Icon name="folder" className="text-sm opacity-50" /> services
                </div>
                <div className="flex items-center gap-2 text-primary text-[10px] pl-4 bg-primary/10 -mx-3 px-3 py-0.5 border-l border-primary">
                  <Icon name="javascript" className="text-sm" /> user.service.ts
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant text-[10px] pl-4">
                  <Icon name="javascript" className="text-sm opacity-50" /> api.gen.ts
                </div>
              </div>
              <div className="flex-1 p-6 font-data-mono text-xs leading-relaxed relative">
                <div><span className="syntax-keyword">import</span> {'{'} <span className="syntax-type">UserService</span> {'}'} <span className="syntax-keyword">from</span> <span className="syntax-string">&apos;./api.gen&apos;</span>;</div>
                <div className="mt-4"><span className="syntax-keyword">async function</span> <span className="syntax-type">fetchUserProfile</span>(id: <span className="syntax-type">string</span>) {'{'}</div>
                <div className="pl-4 mt-1 group">
                  <span className="syntax-keyword">const</span> data = <span className="syntax-keyword">await</span> <span className="bg-primary/20 text-primary px-0.5 relative">UserService.getUserById</span>({'{'} id {'}'});
                  <div className="absolute top-20 left-10 w-64 tech-border bg-tooltip-bg p-4 shadow-2xl z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-[10px] text-primary border-b border-outline pb-2 mb-2 font-bold">API DOCUMENTATION</div>
                    <div className="text-[11px] text-on-surface font-headline-lg font-bold mb-1">getUserById(params)</div>
                    <div className="text-[10px] text-on-surface-variant leading-tight mb-3">获取指定用户的核心画像数据，包含权限与订阅状态。</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-[9px]">
                        <span className="text-outline block uppercase">Method</span>
                        <span className="text-primary-light">GET</span>
                      </div>
                      <div className="text-[9px]">
                        <span className="text-outline block uppercase">Status</span>
                        <span className="text-green-500">200 OK</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-outline flex justify-between items-center">
                      <span className="text-[9px] text-outline italic">Generated by worma</span>
                      <Icon name="link" className="text-xs text-primary" />
                    </div>
                  </div>
                </div>
                <div className="pl-4 mt-1">
                  <span className="syntax-keyword">return</span> data;
                </div>
                <div className="mt-1">{'}'}</div>
                <div className="absolute bottom-12 left-10 w-2 h-4 bg-primary animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
