'use client'

import { ChevronDown, ExternalLink, File as FileIcon, Files, GitBranch, Info, Puzzle, Search as SearchLucide, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CodeBlock } from '@/components/home/code-block'
import {
  PixelBranchIcon,
  PixelEyeIcon,
  PixelQuickInsertIcon,
  PixelSearchIcon,
  PixelSettingsIcon,
  PixelSparkleIcon,
} from '@/components/PixelIcons'

/* ─── Tab definitions ─── */

const ideTabs = [
  { id: 'api-explorer', label: 'API Explorer', desc: 'Explore your API endpoints visually.', icon: <PixelBranchIcon /> },
  { id: 'hover-docs', label: 'Hover Docs', desc: 'Instant API docs on hover.', icon: <PixelEyeIcon /> },
  { id: 'quick-insert', label: 'Quick Insert', desc: 'Insert API calls with one click.', icon: <PixelQuickInsertIcon /> },
  { id: 'portal', label: 'Portal', desc: 'All-in-one API management.', icon: <PixelSettingsIcon /> },
  { id: 'auto-detect', label: 'Auto Detect', desc: 'Detect OpenAPI files automatically.', icon: <PixelSearchIcon /> },
  { id: 'js-intellisense', label: 'JS IntelliSense', desc: 'Smart suggestions for API usage.', icon: <PixelSparkleIcon /> },
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

/* ─── Method color map ─── */
const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  PATCH: 'bg-purple-100 text-purple-700',
}

/* ─── Editor header (reusable) ─── */
function EditorHeader({ filename }: { filename: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-[#21262d] bg-[#161b22] px-5 py-3">
      <div className="flex gap-1.5">
        <div className="h-3 w-3 rounded-full bg-[#f85149]" />
        <div className="h-3 w-3 rounded-full bg-[#d29922]" />
        <div className="h-3 w-3 rounded-full bg-[#3fb950]" />
      </div>
      <span className="ml-2 text-xs text-[#8b949e] tracking-wider">{filename}</span>
    </div>
  )
}

/* ─── Hover Docs Code Demo ─── */
function CodeHoverDemo({ hoverHtml, hoverDocs }: { hoverHtml: string, hoverDocs?: Record<string, string> }) {
  return (
    <div className="h-full min-h-[360px] flex border border-gray-200 rounded-xl bg-gray-50 shadow-sm">
      <div className="w-full flex flex-col overflow-hidden rounded-xl bg-[#0d1117] font-mono">
        <EditorHeader filename="pet-api.ts" />
        <div className="relative flex-1 overflow-auto">
          <CodeBlock
            html={hoverHtml}
            hoverDocs={hoverDocs}
            className="p-5 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0"
          />
        </div>
      </div>
    </div>
  )
}

/* ─── API Tree Explorer ─── */
function APITreeExplorer({ targetEndpointId }: { targetEndpointId?: string | null }) {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set(['pet']))
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(() => mockAPIData[0].endpoints[0])

  useEffect(() => {
    if (!targetEndpointId)
      return
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

  const activityIcons = [
    { id: 'explorer', icon: <Files className="h-5 w-5" />, label: 'Explorer' },
    { id: 'search', icon: <SearchLucide className="h-5 w-5" />, label: 'Search' },
    { id: 'source-control', icon: <GitBranch className="h-5 w-5" />, label: 'Source Control' },
    { id: 'extensions', icon: <Puzzle className="h-5 w-5" />, label: 'Extensions' },
  ]

  return (
    <div className="h-full min-h-[360px] flex overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm">
      {/* Activity Bar */}
      <div className="w-12 flex shrink-0 flex-col items-center gap-1 border-r border-gray-200 bg-gray-100 py-3">
        {activityIcons.map((item) => {
          const isActive = item.id === 'extensions'
          return (
            <div key={item.id} className="group relative h-10 w-10 flex items-center justify-center rounded-md" title={item.label}>
              {isActive && <div className="bg-brand-blue absolute left-0 top-1/2 h-6 w-0.5 rounded-r-full -translate-y-1/2" />}
              <span className={isActive ? 'text-brand-blue' : 'text-gray-400'}>{item.icon}</span>
            </div>
          )
        })}
        <div className="mt-auto h-10 w-10 flex items-center justify-center rounded-md text-gray-400" title="Settings">
          <ExternalLink className="h-4 w-4" />
        </div>
      </div>

      {/* Tree Panel */}
      <div className="w-60 shrink-0 overflow-y-auto border-r border-gray-100 bg-gray-50/50 px-2 py-3">
        <div className="mb-3 px-3"><p className="text-[10px] text-gray-400 font-semibold tracking-[0.15em] uppercase">API Endpoints</p></div>
        {mockAPIData.map((tag) => {
          const isExpanded = expandedTags.has(tag.id)
          return (
            <div key={tag.id} className="mb-1">
              <button onClick={() => toggleTag(tag.id)} className="w-full flex items-center gap-1.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-100">
                <span className="text-gray-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-gray-800 font-bold tracking-wider">{tag.name}</span>
                <span className="ml-auto text-[10px] text-gray-400">{tag.endpoints.length}</span>
              </button>
              {isExpanded && (
                <div className="ml-4">
                  {tag.endpoints.map((ep) => {
                    const isSelected = selectedEndpoint?.id === ep.id
                    return (
                      <button
                        key={ep.id}
                        onClick={() => setSelectedEndpoint(ep)}
                        className={`w-full flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs transition-all ${isSelected ? 'bg-blue-50 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${methodColors[ep.method]}`}>{ep.method}</span>
                        <span className="truncate">{ep.path}</span>
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
      <div className="flex flex-1 flex-col overflow-y-auto">
        {selectedEndpoint
          ? (
              <div className="p-5">
                <div className="mb-5">
                  <div className="mb-2 flex items-center gap-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${methodColors[selectedEndpoint.method]}`}>{selectedEndpoint.method}</span>
                    <span className="text-base text-gray-900 font-bold font-mono">{selectedEndpoint.path}</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedEndpoint.summary}</p>
                </div>
                {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                  <div className="mb-5">
                    <p className="mb-2 text-xs text-gray-400 font-semibold tracking-[0.15em] uppercase">Parameters</p>
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="px-3 py-2 text-gray-500 font-semibold">Name</th>
                            <th className="px-3 py-2 text-gray-500 font-semibold">In</th>
                            <th className="px-3 py-2 text-gray-500 font-semibold">Type</th>
                            <th className="px-3 py-2 text-gray-500 font-semibold">Required</th>
                            <th className="px-3 py-2 text-gray-500 font-semibold">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEndpoint.parameters.map(p => (
                            <tr key={p.name} className="border-b border-gray-100 last:border-0">
                              <td className="px-3 py-2.5 text-gray-800 font-semibold font-mono">{p.name}</td>
                              <td className="px-3 py-2.5 text-gray-500 font-mono">{p.in}</td>
                              <td className="px-3 py-2.5 text-gray-600 font-mono">{p.type}</td>
                              <td className="px-3 py-2.5"><span className={p.required ? 'text-red-500 font-semibold' : 'text-gray-400'}>{p.required ? 'Yes' : 'No'}</span></td>
                              <td className="px-3 py-2.5 text-gray-500">{p.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {selectedEndpoint.responses && selectedEndpoint.responses.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs text-gray-400 font-semibold tracking-[0.15em] uppercase">Responses</p>
                    {selectedEndpoint.responses.map(r => (
                      <div key={r.code} className="mb-3">
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700 font-bold">{r.code}</span>
                          <span className="text-xs text-gray-500">{r.description}</span>
                        </div>
                        <div className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-[12px] text-gray-800 leading-6 font-mono"><pre className="text-gray-700">{r.typeDef}</pre></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          : (
              <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Select an endpoint to view details.</div>
            )}
      </div>
    </div>
  )
}

/* ─── JS IntelliSense Demo ─── */
function JSIntelliSenseDemo() {
  return (
    <div className="h-full min-h-[360px] flex flex-col border border-gray-200 rounded-xl bg-[#0d1117] shadow-sm overflow-hidden font-mono">
      <EditorHeader filename="src/api/alova/services" />
      <div className="flex-1 overflow-auto p-4">
        <p className="mb-4 text-[13px] text-[#8b949e]">
          Each
          {' '}
          <code className="rounded bg-[#30363d] px-1.5 py-0.5 text-[#d2a8ff]">.js</code>
          {' '}
          file is paired with a
          {' '}
          <code className="rounded bg-[#30363d] px-1.5 py-0.5 text-[#d2a8ff]">.d.ts</code>
          {' '}
          declaration file for full type safety.
        </p>

        {/* File tree */}
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-3">
          {/* Folder: services */}
          <div className="flex items-center gap-2 text-[#8b949e]">
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            <FileIcon className="h-3.5 w-3.5 shrink-0 text-[#8b949e]" />
            <span className="text-[13px] text-[#e6edf3] font-semibold">services</span>
          </div>

          <div className="ml-5 border-l border-[#30363d] pl-3 mt-1 space-y-0.5">
            {/* index.js */}
            <div className="flex items-center gap-2 py-0.5">
              <FileIcon className="h-3.5 w-3.5 shrink-0 text-[#d29922]" />
              <span className="text-[13px] text-[#c9d1d9]">index.js</span>
            </div>

            {/* pet.js + pet.d.ts */}
            <div className="flex items-center gap-2 py-0.5">
              <FileIcon className="h-3.5 w-3.5 shrink-0 text-[#d29922]" />
              <span className="text-[13px] text-[#c9d1d9]">pet.js</span>
              <span className="text-[11px] text-[#6e7681]">→</span>
              <span className="text-[13px] text-[#58a6ff] underline decoration-dotted underline-offset-2 cursor-help">pet.d.ts</span>
            </div>

            {/* store.js + store.d.ts */}
            <div className="flex items-center gap-2 py-0.5">
              <FileIcon className="h-3.5 w-3.5 shrink-0 text-[#d29922]" />
              <span className="text-[13px] text-[#c9d1d9]">store.js</span>
              <span className="text-[11px] text-[#6e7681]">→</span>
              <span className="text-[13px] text-[#58a6ff] underline decoration-dotted underline-offset-2 cursor-help">store.d.ts</span>
            </div>

            {/* user.js + user.d.ts */}
            <div className="flex items-center gap-2 py-0.5">
              <FileIcon className="h-3.5 w-3.5 shrink-0 text-[#d29922]" />
              <span className="text-[13px] text-[#c9d1d9]">user.js</span>
              <span className="text-[11px] text-[#6e7681]">→</span>
              <span className="text-[13px] text-[#58a6ff] underline decoration-dotted underline-offset-2 cursor-help">user.d.ts</span>
            </div>
          </div>
        </div>

        {/* Type detail preview */}
        <div className="mt-4 rounded-lg border border-[#30363d] bg-[#161b22] p-3">
          <p className="mb-2 text-[11px] text-[#6e7681] font-semibold tracking-[0.1em] uppercase">pet.d.ts</p>
          <pre className="overflow-x-auto text-[12px] leading-relaxed text-[#c9d1d9]">
            <code>{`declare function getPetById(config: Config): Response;
declare function addPet(config: Config): Response;
declare function updatePet(config: Config): Response;
declare function findPetsByStatus(config: Config): Response;
declare function deletePet(config: Config): Response;`}</code>
          </pre>
          <p className="mt-2 text-[11px] text-[#6e7681]">
            Full type inference for path params, query, body, and response.
          </p>
        </div>

        <div className="mt-3 rounded-lg border border-[#30363d] bg-[#161b22] p-3">
          <p className="mb-2 text-[11px] text-[#6e7681] font-semibold tracking-[0.1em] uppercase">store.d.ts</p>
          <pre className="overflow-x-auto text-[12px] leading-relaxed text-[#c9d1d9]">
            <code>{`declare function getInventory(config: Config): Response;
declare function placeOrder(config: Config): Response;
declare function getOrderById(config: Config): Response;`}</code>
          </pre>
        </div>

        <div className="mt-3 rounded-lg border border-[#30363d] bg-[#161b22] p-3">
          <p className="mb-2 text-[11px] text-[#6e7681] font-semibold tracking-[0.1em] uppercase">user.d.ts</p>
          <pre className="overflow-x-auto text-[12px] leading-relaxed text-[#c9d1d9]">
            <code>{`declare function loginUser(config: Config): Response;`}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

/* ─── Portal Preview ─── */
function PortalPreview({ topHtml, bottomHtml, onViewApi, hoverDocs }: { topHtml: string, bottomHtml: string, onViewApi: () => void, hoverDocs?: Record<string, string> }) {
  return (
    <div className="relative h-full min-h-[360px] flex overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm">
      <div className="w-full flex flex-col overflow-hidden rounded-xl bg-[#0d1117] font-mono">
        <EditorHeader filename="pet-service.ts" />
        <div className="flex-1 overflow-auto px-5 py-4">
          {topHtml && bottomHtml
            ? (
                <>
                  <CodeBlock
                    html={topHtml}
                    hoverDocs={hoverDocs}
                    className="[&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0"
                  />
                  <div className="my-2 flex pl-[calc(2em+20px)]">
                    <button onClick={onViewApi} className="inline-flex items-center gap-2 border border-[#58a6ff]/40 rounded-md bg-[#1f6feb]/15 px-3 py-1.5 text-xs text-[#58a6ff] font-semibold transition-all active:scale-[0.98] hover:border-[#58a6ff]/60 hover:bg-[#1f6feb]/25">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Api: getPetById
                    </button>
                  </div>
                  <CodeBlock
                    html={bottomHtml}
                    hoverDocs={hoverDocs}
                    className="[&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0"
                  />
                </>
              )
            : (
                <pre className="text-sm text-[#8b949e] leading-7">Loading...</pre>
              )}
        </div>
      </div>
    </div>
  )
}

/* ─── Quick Insert Demo ─── */
function QuickInsertDemo({ codeHtml, hoverDocs }: { codeHtml: string, hoverDocs?: Record<string, string> }) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const allEndpoints = mockAPIData.flatMap(tag => tag.endpoints.map(ep => ({ ...ep, tagName: tag.name })))

  const filtered = search.trim()
    ? allEndpoints.filter(ep => ep.path.toLowerCase().includes(search.toLowerCase()) || ep.summary.toLowerCase().includes(search.toLowerCase()) || ep.method.toLowerCase().includes(search.toLowerCase()))
    : allEndpoints

  useEffect(() => { setSelectedIndex(0) }, [search])

  return (
    <div className="relative h-full min-h-[360px] flex overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm">
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-[#0d1117] font-mono">
        <EditorHeader filename="main.js" />
        <div className="relative flex-1 overflow-auto">
          {codeHtml
            ? (
                <CodeBlock
                  html={codeHtml}
                  hoverDocs={hoverDocs}
                  className="p-5 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0"
                />
              )
            : (
                <pre className="p-5 text-sm text-[#8b949e] leading-[1.25]">Loading...</pre>
              )}
          <div className="px-5 pb-4">
            <button className="mt-2 inline-flex items-center gap-1.5 border border-[#58a6ff]/30 rounded bg-[#1f6feb]/10 px-2.5 py-1 text-[11px] text-[#58a6ff] transition-colors hover:bg-[#1f6feb]/20">
              <ExternalLink className="h-3 w-3" />
              View Api: getPetById (5 sources)
            </button>
          </div>
        </div>
      </div>
      {/* Floating Search Panel */}
      <div className="absolute right-3 top-3 w-[340px] overflow-hidden rounded-lg border border-[#3d444d] bg-[#252526] shadow-[0_4px_20px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-[#3d444d] bg-[#1e1e1e] px-3 py-2">
          <span className="text-[13px] text-[#e6edf3] font-semibold">Code Snippets</span>
          <button className="text-[#8b949e] hover:text-[#e6edf3]"><X className="h-3.5 w-3.5" /></button>
        </div>
        <div className="border-b border-[#3d444d] p-2">
          <div className="relative">
            <SearchLucide className="absolute left-2.5 top-1/2 h-3.5 w-3.5 text-[#6e7681] -translate-y-1/2" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search snippets..." className="w-full border border-[#3d444d] rounded bg-[#0d1117] py-1.5 pl-8 pr-3 text-[13px] text-[#c9d1d9] outline-none placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]" />
          </div>
        </div>
        <div className="max-h-[280px] overflow-y-auto">
          {filtered.length === 0
            ? (
                <div className="px-3 py-4 text-center text-[13px] text-[#6e7681]">No results found</div>
              )
            : (
                filtered.map((ep, idx) => (
                  <button key={ep.id} onClick={() => setSelectedIndex(idx)} className={`w-full px-3 py-2 text-left transition-colors ${idx === selectedIndex ? 'bg-[#58a6ff]/15' : 'hover:bg-[#30363d]/50'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${methodColors[ep.method]}`}>{ep.method}</span>
                      <span className="truncate text-[13px] text-[#e6edf3] font-mono">{ep.path}</span>
                      <span className="truncate text-[13px] text-[#8b949e]">{ep.summary}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#6e7681]">Language: All</div>
                  </button>
                ))
              )}
        </div>
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
    setToastMsg(toastMessages[msgIndex])
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % toastMessages.length
      setToastVisible(false)
      setTimeout(() => { setToastMsg(toastMessages[msgIndex]); setToastVisible(true) }, 300)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-full min-h-[360px] flex overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm">
      <div className="w-full flex flex-col overflow-hidden rounded-xl bg-[#0d1117] font-mono">
        <EditorHeader filename="project-root" />
        <div className="flex flex-1 items-center justify-center"><p className="text-sm text-[#8b949e]">// Auto fetch OpenAPI file every n sections</p></div>
      </div>
      <div className={`absolute bottom-4 right-4 z-50 transition-all duration-300 ease-out ${toastVisible ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 translate-x-5 translate-y-5 pointer-events-none'}`}>
        <div className="flex items-center gap-2.5 rounded-lg border border-[#3d444d] bg-[#252526] px-4 py-3 text-[13px] text-[#c9d1d9] shadow-[0_4px_20px_rgba(0,0,0,0.45)]">
          <Info className="h-4 w-4 shrink-0 text-[#58a6ff]" />
          <span>{toastMsg}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Main IDE Experience Tabs ─── */

export interface IDEExperienceTabsProps {
  hoverCodeHtml: string
  portalTopHtml: string
  portalBottomHtml: string
  quickInsertHtml: string
  hoverDocs?: Record<string, string>
}

export function IDEExperienceTabs({ hoverCodeHtml, portalTopHtml, portalBottomHtml, quickInsertHtml, hoverDocs }: IDEExperienceTabsProps) {
  const [active, setActive] = useState('api-explorer')
  const [portalTargetEP, setPortalTargetEP] = useState<string | null>(null)

  const handlePortalViewApi = () => { setPortalTargetEP('getPetById'); setActive('api-explorer') }

  const renderContent = () => {
    switch (active) {
      case 'api-explorer': return <APITreeExplorer targetEndpointId={portalTargetEP} />
      case 'hover-docs': return <CodeHoverDemo hoverHtml={hoverCodeHtml} hoverDocs={hoverDocs} />
      case 'quick-insert': return <QuickInsertDemo codeHtml={quickInsertHtml} hoverDocs={hoverDocs} />
      case 'portal': return <PortalPreview topHtml={portalTopHtml} bottomHtml={portalBottomHtml} onViewApi={handlePortalViewApi} hoverDocs={hoverDocs} />
      case 'auto-detect': return <AutoDetectDemo />
      case 'js-intellisense': return <JSIntelliSenseDemo />
      default: return null
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="flex flex-col gap-2 lg:col-span-4">
        {ideTabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`group relative flex items-center gap-4 border rounded-xl px-5 py-4 text-left transition-all duration-300 ${isActive ? 'border-brand-blue/20 bg-blue-50/60 shadow-sm' : 'border-transparent bg-transparent hover:border-gray-200 hover:bg-gray-50/50'}`}
            >
              <div className={`h-10 w-10 flex shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${isActive ? 'bg-brand-blue/10 text-brand-blue' : 'bg-gray-100/80 text-gray-400 group-hover:text-gray-600'}`}>
                {tab.icon}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-bold tracking-wider transition-colors duration-300 ${isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'}`}>{tab.label}</p>
                <p className={`mt-0.5 text-xs leading-relaxed transition-colors duration-300 ${isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'}`}>{tab.desc}</p>
              </div>
              {isActive && <div className="bg-brand-blue absolute left-0 top-1/2 h-8 w-1 rounded-r-full -translate-y-1/2" />}
            </button>
          )
        })}
      </div>
      <div className="lg:col-span-8">
        <div key={active} className="h-full animate-[tab-in_0.3s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]">{renderContent()}</div>
      </div>
    </div>
  )
}
