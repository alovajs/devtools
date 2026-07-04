'use client'

import { useEffect, useState } from 'react'
import CornerPlus from './CornerPlus'
import Icon from './Icon'
import SectionHeader from './SectionHeader'

/* ─── Tab definitions ─── */
const ideTabs = [
  { id: 'api-explorer', label: 'API 资源管理器', desc: '可视化浏览所有 API 端点', icon: 'account_tree' },
  { id: 'hover-docs', label: '悬浮文档', desc: '悬浮鼠标即可查看 API 文档', icon: 'description' },
  { id: 'quick-insert', label: '快速插入', desc: '一键插入 API 调用代码', icon: 'add_circle' },
  { id: 'portal', label: '传送门', desc: '代码与 API 文档联动跳转', icon: 'open_in_new' },
  { id: 'auto-detect', label: '自动检测', desc: '自动检测 OpenAPI 文件变更', icon: 'autorenew' },
  { id: 'js-intellisense', label: 'JS IntelliSense', desc: '完整的类型推导与智能提示', icon: 'psychology' },
]

/* ─── Mock API Data ─── */
interface APIEndpoint {
  id: string
  method: string
  path: string
  summary: string
  parameters?: { name: string, in: string, type: string, required: boolean, description: string }[]
  responses?: { code: string, description: string, typeDef: string }[]
}

interface APITag {
  id: string
  name: string
  description: string
  endpoints: APIEndpoint[]
}

const mockAPIData: APITag[] = [
  {
    id: 'pet',
    name: 'Pet',
    description: 'Everything about your Pets',
    endpoints: [
      {
        id: 'getPetById',
        method: 'GET',
        path: '/pet/{petId}',
        summary: 'Find pet by ID',
        parameters: [{ name: 'petId', in: 'path', type: 'integer($int64)', required: true, description: 'ID of pet to return' }],
        responses: [{ code: '200', description: 'successful operation', typeDef: '{\n  id?: number\n  name: string\n  category?: { id?: number; name?: string }\n  photoUrls: string[]\n  tags?: Array<{ id?: number; name?: string }>\n  status?: "available" | "pending" | "sold"\n}' }],
      },
      { id: 'addPet', method: 'POST', path: '/pet', summary: 'Add a new pet to the store', responses: [{ code: '200', description: 'successful operation', typeDef: '{\n  id?: number\n  name: string\n  status?: string\n}' }] },
      { id: 'updatePet', method: 'PUT', path: '/pet', summary: 'Update an existing pet', responses: [{ code: '200', description: 'successful operation', typeDef: '{\n  id?: number\n  name: string\n  status?: string\n}' }] },
      { id: 'findPetsByStatus', method: 'GET', path: '/pet/findByStatus', summary: 'Finds Pets by status', parameters: [{ name: 'status', in: 'query', type: 'array[string]', required: true, description: 'Status values that need to be considered' }], responses: [{ code: '200', description: 'successful operation', typeDef: 'Array<{\n  id?: number\n  name: string\n  status?: string\n}>' }] },
    ],
  },
  {
    id: 'store',
    name: 'Store',
    description: 'Access to Petstore orders',
    endpoints: [
      { id: 'getInventory', method: 'GET', path: '/store/inventory', summary: 'Returns pet inventories by status', responses: [{ code: '200', description: 'successful operation', typeDef: '{\n  [key: string]: number\n}' }] },
      { id: 'placeOrder', method: 'POST', path: '/store/order', summary: 'Place an order for a pet', responses: [{ code: '200', description: 'successful operation', typeDef: '{\n  id?: number\n  petId?: number\n  quantity?: number\n  shipDate?: string\n  status?: "placed" | "approved" | "delivered"\n  complete?: boolean\n}' }] },
      { id: 'getOrderById', method: 'GET', path: '/store/order/{orderId}', summary: 'Find purchase order by ID', parameters: [{ name: 'orderId', in: 'path', type: 'integer($int64)', required: true, description: 'ID of order that needs to be fetched' }], responses: [{ code: '200', description: 'successful operation', typeDef: '{\n  id?: number\n  petId?: number\n  quantity?: number\n  shipDate?: string\n  status?: string\n}' }] },
    ],
  },
  {
    id: 'user',
    name: 'User',
    description: 'Operations about user',
    endpoints: [
      { id: 'createUser', method: 'POST', path: '/user', summary: 'Create user', responses: [{ code: '200', description: 'successful operation', typeDef: '{\n  id?: number\n  username?: string\n  email?: string\n}' }] },
      { id: 'loginUser', method: 'GET', path: '/user/login', summary: 'Logs user into the system', parameters: [{ name: 'username', in: 'query', type: 'string', required: true, description: 'The user name for login' }, { name: 'password', in: 'query', type: 'string', required: true, description: 'The password for login' }], responses: [{ code: '200', description: 'successful operation', typeDef: 'string' }] },
    ],
  },
]

/* ─── Method color map (dark theme) ─── */
const methodColors: Record<string, string> = {
  GET: 'bg-green-500/10 text-green-400 border-green-500/20',
  POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  PATCH: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

const methodColorsBadge: Record<string, string> = {
  GET: 'bg-green-500/20 text-green-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PUT: 'bg-amber-500/20 text-amber-400',
  DELETE: 'bg-red-500/20 text-red-400',
  PATCH: 'bg-purple-500/20 text-purple-400',
}

/* ─── Editor Header ─── */
function EditorHeader({ filename }: { filename: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-editor-titlebar tech-border-b">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-window-control" />
        <div className="w-2.5 h-2.5 rounded-full bg-window-control" />
        <div className="w-2.5 h-2.5 rounded-full bg-window-control" />
      </div>
      <div className="text-[10px] font-data-mono text-on-surface-variant">{filename}</div>
      <div className="w-10" />
    </div>
  )
}

/* ─── API Tree Explorer ─── */
function APITreeExplorer({ targetEndpointId }: { targetEndpointId?: string | null }) {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set(['pet']))
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint>(mockAPIData[0].endpoints[0])

  useEffect(() => {
    if (!targetEndpointId) return
    for (const tag of mockAPIData) {
      const ep = tag.endpoints.find(e => e.id === targetEndpointId)
      if (ep) {
        setExpandedTags((prev) => { const next = new Set(prev); next.add(tag.id); return next })
        setSelectedEndpoint(ep)
        break
      }
    }
  }, [targetEndpointId])

  const toggleTag = (tagId: string) => {
    setExpandedTags((prev) => { const next = new Set(prev); next.has(tagId) ? next.delete(tagId) : next.add(tagId); return next })
  }

  return (
    <div className="h-full min-h-[420px] flex tech-border bg-editor-bg overflow-hidden">
      {/* Sidebar */}
      <div className="w-12 flex shrink-0 flex-col items-center gap-1 tech-border-r bg-surface py-3">
        {[
          { id: 'explorer', icon: 'description' },
          { id: 'search', icon: 'search' },
          { id: 'source-control', icon: 'account_tree' },
          { id: 'extensions', icon: 'extension' },
        ].map((item, idx) => {
          const isActive = idx === 0
          return (
            <div key={item.id} className="group relative h-10 w-10 flex items-center justify-center" title={item.id}>
              {isActive && <div className="bg-primary absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2" />}
              <Icon name={item.icon} className={`text-sm ${isActive ? 'text-primary' : 'text-on-surface-variant'}`} />
            </div>
          )
        })}
        <div className="mt-auto h-10 w-10 flex items-center justify-center text-on-surface-variant">
          <Icon name="settings" className="text-sm" />
        </div>
      </div>

      {/* Tree Panel */}
      <div className="w-60 shrink-0 overflow-y-auto tech-border-r bg-surface-variant/50 px-2 py-3">
        <div className="mb-3 px-3"><p className="text-[10px] text-on-surface-variant font-data-mono font-semibold tracking-[0.15em] uppercase">API Endpoints</p></div>
        {mockAPIData.map((tag) => {
          const isExpanded = expandedTags.has(tag.id)
          return (
            <div key={tag.id} className="mb-1">
              <button onClick={() => toggleTag(tag.id)} className="w-full flex items-center gap-1.5 px-3 py-2 text-left transition-colors hover:bg-surface">
                <Icon name="chevron_right" className={`text-xs text-on-surface-variant transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                <span className="text-sm text-on-surface font-headline-lg font-bold tracking-wider">{tag.name}</span>
                <span className="ml-auto text-[10px] text-on-surface-variant font-data-mono">{tag.endpoints.length}</span>
              </button>
              {isExpanded && (
                <div className="ml-4">
                  {tag.endpoints.map((ep) => {
                    const isSelected = selectedEndpoint?.id === ep.id
                    return (
                      <button
                        key={ep.id}
                        onClick={() => setSelectedEndpoint(ep)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-all ${isSelected ? 'bg-primary/10 text-on-surface border-l border-primary' : 'text-on-surface-variant hover:bg-surface-variant'}`}
                      >
                        <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-data-mono font-bold border ${methodColors[ep.method]}`}>{ep.method}</span>
                        <span className="truncate font-data-mono">{ep.path}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Detail Panel */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-editor-bg">
        {selectedEndpoint
          ? (
              <div className="p-5">
                <div className="mb-5">
                  <div className="mb-2 flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-xs font-data-mono font-bold border ${methodColors[selectedEndpoint.method]}`}>{selectedEndpoint.method}</span>
                    <span className="text-base text-on-background font-headline-lg font-bold font-mono">{selectedEndpoint.path}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{selectedEndpoint.summary}</p>
                </div>
                {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                  <div className="mb-5">
                    <p className="mb-2 text-xs text-on-surface-variant font-data-mono font-semibold tracking-[0.15em] uppercase">Parameters</p>
                    <div className="overflow-hidden tech-border">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="tech-border-b bg-surface-variant/50">
                            <th className="px-3 py-2 text-on-surface-variant font-data-mono font-semibold">Name</th>
                            <th className="px-3 py-2 text-on-surface-variant font-data-mono font-semibold">In</th>
                            <th className="px-3 py-2 text-on-surface-variant font-data-mono font-semibold">Type</th>
                            <th className="px-3 py-2 text-on-surface-variant font-data-mono font-semibold">Required</th>
                            <th className="px-3 py-2 text-on-surface-variant font-data-mono font-semibold">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEndpoint.parameters.map(p => (
                            <tr key={p.name} className="tech-border-b last:border-0">
                              <td className="px-3 py-2.5 text-on-surface font-data-mono font-semibold">{p.name}</td>
                              <td className="px-3 py-2.5 text-on-surface-variant font-data-mono">{p.in}</td>
                              <td className="px-3 py-2.5 text-on-surface-variant font-data-mono">{p.type}</td>
                              <td className="px-3 py-2.5"><span className={p.required ? 'text-primary font-semibold' : 'text-on-surface-variant'}>{p.required ? 'Yes' : 'No'}</span></td>
                              <td className="px-3 py-2.5 text-on-surface-variant">{p.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {selectedEndpoint.responses && selectedEndpoint.responses.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs text-on-surface-variant font-data-mono font-semibold tracking-[0.15em] uppercase">Responses</p>
                    {selectedEndpoint.responses.map(r => (
                      <div key={r.code} className="mb-3">
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="bg-green-500/10 text-green-400 px-1.5 py-0.5 text-[10px] font-data-mono font-bold border border-green-500/20">{r.code}</span>
                          <span className="text-xs text-on-surface-variant">{r.description}</span>
                        </div>
                        <div className="overflow-x-auto bg-surface p-3 text-[12px] text-on-surface leading-6 font-data-mono border border-outline"><pre>{r.typeDef}</pre></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          : (
              <div className="flex flex-1 items-center justify-center text-sm text-on-surface-variant font-data-mono">选择一个端点以查看详情</div>
            )}
      </div>
    </div>
  )
}

/* ─── Hover Docs Demo ─── */
function HoverDocsDemo() {
  return (
    <div className="h-full min-h-[420px] flex flex-col tech-border bg-editor-bg overflow-hidden">
      <EditorHeader filename="src/services/pet.service.ts — Visual Studio Code" />
      <div className="flex flex-1 min-h-[360px]">
        <div className="w-40 tech-border-r bg-editor-sidebar hidden sm:flex flex-col p-3 gap-2">
          <div className="text-[9px] font-data-mono text-on-surface-variant uppercase mb-2">Explorer</div>
          <div className="flex items-center gap-2 text-on-surface-variant text-[10px] font-data-mono">
            <Icon name="folder" className="text-sm opacity-50" /> src
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant text-[10px] font-data-mono pl-2">
            <Icon name="folder" className="text-sm opacity-50" /> services
          </div>
          <div className="flex items-center gap-2 text-primary text-[10px] font-data-mono pl-4 bg-primary/10 -mx-3 px-3 py-0.5 border-l border-primary">
            <Icon name="javascript" className="text-sm" /> pet.service.ts
          </div>
        </div>
        <div className="flex-1 p-6 font-data-mono text-xs leading-relaxed relative overflow-auto">
          <div><span className="syntax-keyword">import</span> {'{'} <span className="syntax-type">getPetById</span> {'}'} <span className="syntax-keyword">from</span> <span className="syntax-string">&apos;@/api/services/pet&apos;</span>;</div>
          <div className="mt-4" />
          <div className="group relative">
            <span className="syntax-keyword">const</span> pet = <span className="syntax-keyword">await</span> <span className="bg-primary/20 text-primary px-0.5 cursor-help border-b border-dotted border-primary/75 relative">getPetById</span>({'{'} <span className="text-on-surface">pathParams</span>: {'{'} petId: <span className="text-accent-blue">1</span> {'}'} {'}'});
            {/* Hover Tooltip — matching original renderJsDoc content */}
            <div className="absolute top-full left-0 mt-2 w-96 max-w-[calc(100vw-2rem)] tech-border bg-tooltip-bg p-4 shadow-2xl z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {/* [GET] Find pet by ID */}
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-500 text-black px-2 py-0.5 text-[10px] font-data-mono font-bold rounded">GET</span>
                <span className="text-[13px] text-on-surface font-headline-lg">Find pet by ID</span>
              </div>
              {/* path: /pet/{petId} */}
              <div className="text-[12px] text-on-surface-variant mb-3">
                path:<span className="ml-1 text-on-surface font-data-mono">/pet/{'{petId}'}</span>
              </div>
              {/* Path Parameters */}
              <div className="text-[12px] text-on-surface font-headline-lg font-semibold mb-1">Path Parameters</div>
              <pre className="mb-3 tech-border bg-surface p-3 text-[12px] text-on-surface leading-[1.35] font-data-mono overflow-x-auto">
                <code>{`type PathParameters = {
  // ID of pet to return
  petId: number
}`}</code>
              </pre>
              {/* Response */}
              <div className="text-[12px] text-on-surface font-headline-lg font-semibold mb-1">Response</div>
              <pre className="tech-border bg-surface p-3 text-[12px] text-on-surface leading-[1.35] font-data-mono overflow-x-auto">
                <code>{`type Response = {
  id?: number
  name: string
  category?: { id?: number; name?: string }
  photoUrls: string[]
  tags?: Array<{ id?: number; name?: string }>
  status?: "available" | "pending" | "sold"
}`}</code>
              </pre>
              <div className="mt-3 pt-2 border-t border-outline flex justify-between items-center">
                <span className="text-[9px] text-on-surface-variant italic">Generated by worma</span>
                <Icon name="link" className="text-xs text-primary" />
              </div>
            </div>
          </div>
          <div className="mt-1">
            <span className="text-on-surface-variant">// Hover over getPetById to see API docs</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Quick Insert Demo ─── */
function QuickInsertDemo() {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const allEndpoints = mockAPIData.flatMap(tag => tag.endpoints.map(ep => ({ ...ep, tagName: tag.name })))

  const filtered = search.trim()
    ? allEndpoints.filter(ep => ep.path.toLowerCase().includes(search.toLowerCase()) || ep.summary.toLowerCase().includes(search.toLowerCase()) || ep.method.toLowerCase().includes(search.toLowerCase()))
    : allEndpoints

  useEffect(() => { setSelectedIndex(0) }, [search])

  return (
    <div className="h-full min-h-[420px] flex tech-border bg-editor-bg overflow-hidden relative">
      <div className="flex flex-1 flex-col overflow-hidden">
        <EditorHeader filename="src/main.js — Visual Studio Code" />
        <div className="flex-1 overflow-auto p-6 font-data-mono text-xs leading-relaxed">
          <div><span className="syntax-keyword">import</span> {'{'} <span className="syntax-type">getPetById</span> {'}'} <span className="syntax-keyword">from</span> <span className="syntax-string">&apos;@/api/services/pet&apos;</span>;</div>
          <div className="mt-4" />
          <div><span className="syntax-type">getPetById</span>({'{'}</div>
          <div className="pl-4"><span className="text-on-surface">pathParams</span>: {'{'}</div>
          <div className="pl-8"><span className="text-on-surface">petId</span>: <span className="text-accent-blue">1</span></div>
          <div className="pl-4">{'}'}</div>
          <div className="mt-3">{'})'}</div>
          <div className="mt-6 flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] text-primary font-data-mono transition-colors hover:bg-primary/20">
              <Icon name="open_in_new" className="text-xs" />
              View Api: getPetById (5 sources)
            </button>
          </div>
        </div>
      </div>

      {/* Floating Search Panel */}
      <div className="absolute right-4 top-12 w-[340px] tech-border bg-surface shadow-2xl z-20 font-data-mono">
        <div className="flex items-center justify-between tech-border-b bg-surface-variant px-3 py-2">
          <span className="text-[11px] text-on-surface font-headline-lg font-bold">Code Snippets</span>
          <button className="text-on-surface-variant hover:text-on-surface"><Icon name="close" className="text-sm" /></button>
        </div>
        <div className="tech-border-b p-2">
          <div className="relative">
            <Icon name="search" className="absolute left-2.5 top-1/2 text-sm text-on-surface-variant -translate-y-1/2" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索代码片段..." className="w-full tech-border bg-editor-bg py-1.5 pl-8 pr-3 text-[11px] text-on-surface outline-none font-data-mono placeholder:text-on-surface-variant focus:border-primary" />
          </div>
        </div>
        <div className="max-h-[280px] overflow-y-auto">
          {filtered.length === 0
            ? (
                <div className="px-3 py-4 text-center text-[11px] text-on-surface-variant">无结果</div>
              )
            : (
                filtered.map((ep, idx) => (
                  <button key={ep.id} onClick={() => setSelectedIndex(idx)} className={`w-full px-3 py-2 text-left transition-colors ${idx === selectedIndex ? 'bg-primary/10' : 'hover:bg-surface-variant/50'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold ${methodColorsBadge[ep.method]}`}>{ep.method}</span>
                      <span className="truncate text-[12px] text-on-surface">{ep.path}</span>
                      <span className="truncate text-[12px] text-on-surface-variant">{ep.summary}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-on-surface-variant">Language: All</div>
                  </button>
                ))
              )}
        </div>
      </div>
    </div>
  )
}

/* ─── Portal Demo ─── */
function PortalDemo({ onViewApi }: { onViewApi: () => void }) {
  return (
    <div className="h-full min-h-[420px] flex flex-col tech-border bg-editor-bg overflow-hidden">
      <EditorHeader filename="src/services/pet.service.ts — Visual Studio Code" />
      <div className="flex-1 overflow-auto p-6 font-data-mono text-xs leading-relaxed">
        <div><span className="syntax-keyword">import</span> {'{'} <span className="syntax-type">getPetById</span> {'}'} <span className="syntax-keyword">from</span> <span className="syntax-string">&apos;@/api/services/pet&apos;</span>;</div>
        <div className="mt-4" />
        <div className="text-on-surface-variant">// 点击下方按钮跳转到 API Explorer</div>
        <div className="my-3 flex">
          <button
            onClick={onViewApi}
            className="inline-flex items-center gap-2 border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs text-primary font-data-mono font-semibold transition-all active:scale-[0.98] hover:border-primary/60 hover:bg-primary/25"
          >
            <Icon name="open_in_new" className="text-xs" />
            View Api: getPetById
          </button>
        </div>
        <div className="mt-4" />
        <div><span className="syntax-keyword">const</span> pet = <span className="syntax-keyword">await</span> <span className="syntax-type">getPetById</span>({'{'} <span className="text-on-surface">pathParams</span>: {'{'} petId: <span className="text-accent-blue">1</span> {'}'} {'}'});</div>
        <div className="mt-6" />
        <div className="text-on-surface-variant">// View Api 按钮上方跳转到 API Explorer 标签页</div>
      </div>
    </div>
  )
}

/* ─── Auto Detect Demo ─── */
function AutoDetectDemo() {
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('Done! 5 modules updated')
  const toastMessages = ['Done! 5 modules updated', 'Done! 3 new endpoints detected', 'Done! API schema refreshed', 'Done! 2 services regenerated']

  useEffect(() => {
    let msgIndex = 0
    setToastVisible(true)
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % toastMessages.length
      setToastVisible(false)
      setTimeout(() => { setToastMsg(toastMessages[msgIndex]); setToastVisible(true) }, 300)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full min-h-[420px] flex tech-border bg-editor-bg overflow-hidden relative">
      <div className="flex flex-1 flex-col overflow-hidden">
        <EditorHeader filename="project-root — Visual Studio Code" />
        <div className="flex-1 overflow-auto p-6 font-data-mono text-xs leading-relaxed">
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-primary animate-pulse" />
              <span className="text-on-surface text-sm">监听 OpenAPI 文件变更中...</span>
            </div>
            <div className="tech-border bg-surface-variant p-6 max-w-md w-full">
              <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-3">检测配置</div>
              <div className="space-y-2 text-xs text-on-surface-variant">
                <div className="flex justify-between">
                  <span>扫描间隔</span>
                  <span className="text-primary">5 分钟</span>
                </div>
                <div className="flex justify-between">
                  <span>OpenAPI 路径</span>
                  <span className="text-on-surface">./openapi.yaml</span>
                </div>
                <div className="flex justify-between">
                  <span>输出目录</span>
                  <span className="text-on-surface">./src/api/</span>
                </div>
                <div className="flex justify-between">
                  <span>上次检测</span>
                  <span className="text-green-400">刚刚</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Toast */}
      <div className={`absolute bottom-4 right-4 z-50 transition-all duration-300 ease-out ${toastVisible ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 translate-x-5 translate-y-5 pointer-events-none'}`}>
        <div className="flex items-center gap-2.5 tech-border bg-surface px-4 py-3 text-[12px] text-on-surface font-data-mono shadow-2xl">
          <Icon name="info" className="text-sm text-primary" />
          <span>{toastMsg}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── JS IntelliSense Demo ─── */
function JSIntelliSenseDemo() {
  return (
    <div className="h-full min-h-[420px] flex flex-col tech-border bg-editor-bg overflow-hidden">
      <EditorHeader filename="src/api/alova/services — Visual Studio Code" />
      <div className="flex-1 overflow-auto p-5 font-data-mono">
        <p className="mb-4 text-[12px] text-on-surface-variant">
          每个 <code className="bg-outline px-1.5 py-0.5 text-primary-light">.js</code> 文件都配有
          <code className="bg-outline px-1.5 py-0.5 text-primary-light"> .d.ts</code> 声明文件，确保完整的类型安全。
        </p>

        {/* File tree */}
        <div className="tech-border bg-surface p-4 mb-4">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Icon name="chevron_right" className="text-sm rotate-90" />
            <Icon name="folder" className="text-sm text-on-surface-variant" />
            <span className="text-[13px] text-on-surface font-headline-lg font-semibold">services</span>
          </div>

          <div className="ml-5 border-l border-outline pl-3 mt-2 space-y-1">
            <div className="flex items-center gap-2 py-0.5">
              <Icon name="javascript" className="text-sm text-amber-400" />
              <span className="text-[12px] text-on-surface">index.js</span>
            </div>
            <div className="flex items-center gap-2 py-0.5">
              <Icon name="javascript" className="text-sm text-amber-400" />
              <span className="text-[12px] text-on-surface">pet.js</span>
              <span className="text-[10px] text-on-surface-variant">→</span>
              <span className="text-[12px] text-accent-blue underline decoration-dotted underline-offset-2 cursor-help">pet.d.ts</span>
            </div>
            <div className="flex items-center gap-2 py-0.5">
              <Icon name="javascript" className="text-sm text-amber-400" />
              <span className="text-[12px] text-on-surface">store.js</span>
              <span className="text-[10px] text-on-surface-variant">→</span>
              <span className="text-[12px] text-accent-blue underline decoration-dotted underline-offset-2 cursor-help">store.d.ts</span>
            </div>
            <div className="flex items-center gap-2 py-0.5">
              <Icon name="javascript" className="text-sm text-amber-400" />
              <span className="text-[12px] text-on-surface">user.js</span>
              <span className="text-[10px] text-on-surface-variant">→</span>
              <span className="text-[12px] text-accent-blue underline decoration-dotted underline-offset-2 cursor-help">user.d.ts</span>
            </div>
          </div>
        </div>

        {/* Type declarations */}
        {[
          {
            file: 'pet.d.ts',
            code: `declare function getPetById(config: Config): Response;
declare function addPet(config: Config): Response;
declare function updatePet(config: Config): Response;
declare function findPetsByStatus(config: Config): Response;
declare function deletePet(config: Config): Response;`,
            hint: '完整的类型推导：路径参数、查询、请求体与响应',
          },
          {
            file: 'store.d.ts',
            code: `declare function getInventory(config: Config): Response;
declare function placeOrder(config: Config): Response;
declare function getOrderById(config: Config): Response;`,
          },
          {
            file: 'user.d.ts',
            code: `declare function loginUser(config: Config): Response;`,
          },
        ].map(item => (
          <div key={item.file} className="tech-border bg-surface p-3 mb-3">
            <p className="mb-2 text-[10px] text-on-surface-variant font-data-mono font-semibold tracking-[0.1em] uppercase">{item.file}</p>
            <pre className="overflow-x-auto text-[11px] leading-relaxed text-on-surface"><code>{item.code}</code></pre>
            {item.hint && (
              <p className="mt-2 text-[10px] text-on-surface-variant">{item.hint}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Main IdeEditor Component ─── */
export default function IdeEditor() {
  const [active, setActive] = useState('api-explorer')
  const [portalTargetEP, setPortalTargetEP] = useState<string | null>(null)

  const handlePortalViewApi = () => {
    setPortalTargetEP('getPetById')
    setActive('api-explorer')
  }

  // Clear portal target when switching away from api-explorer
  const handleTabChange = (tabId: string) => {
    if (tabId !== 'api-explorer') setPortalTargetEP(null)
    setActive(tabId)
  }

  const renderContent = () => {
    switch (active) {
      case 'api-explorer': return <APITreeExplorer targetEndpointId={portalTargetEP} />
      case 'hover-docs': return <HoverDocsDemo />
      case 'quick-insert': return <QuickInsertDemo />
      case 'portal': return <PortalDemo onViewApi={handlePortalViewApi} />
      case 'auto-detect': return <AutoDetectDemo />
      case 'js-intellisense': return <JSIntelliSenseDemo />
      default: return null
    }
  }

  return (
    <section className="tech-border-b bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Panel — Tab List */}
        <div className="lg:col-span-4 p-8 lg:p-12 lg:tech-border-r flex flex-col relative">
          <CornerPlus />
          <SectionHeader label="05 // INTEGRATION" title="IDE 级深度集成" className="mb-6" />
          <p className="font-body-md text-sm text-on-surface-variant mb-8 leading-relaxed">
            在你的开发环境中直接获得上帝视角。强大的类型推导与悬浮文档，让 API 调用不再盲目。
          </p>
          <div className="flex flex-col gap-2 mb-8">
            {ideTabs.map((tab) => {
              const isActive = active === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`tech-border p-3 cursor-pointer transition-all text-left group ${isActive ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-outline'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-headline-lg text-xs font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>
                      {tab.label}
                    </span>
                    <Icon name={isActive ? 'radio_button_checked' : 'radio_button_unchecked'} className={`text-xs ${isActive ? 'text-primary' : 'text-outline-variant group-hover:text-primary'}`} />
                  </div>
                  <div className="font-data-mono text-[10px] text-on-surface-variant mt-1">{tab.desc}</div>
                </button>
              )
            })}
          </div>
          <div className="mt-auto">
            <a href="/docs/guide/editor-docs" className="flex items-center gap-2 group text-primary font-data-mono text-xs uppercase tracking-widest">
              <span className="p-2 border border-primary group-hover:bg-primary group-hover:text-black transition-all">
                <Icon name="open_in_new" className="text-sm" />
              </span>
              前往文档中心
            </a>
          </div>
        </div>

        {/* Right Panel — Content */}
        <div className="lg:col-span-8 p-6 lg:p-12 bg-surface-variant/50 relative overflow-x-auto">
          <div key={active} className="min-w-[720px] animate-[tab-in_0.3s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]">
            {renderContent()}
          </div>
        </div>
      </div>
    </section>
  )
}
