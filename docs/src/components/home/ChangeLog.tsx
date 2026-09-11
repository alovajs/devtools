import type { Locale } from '@/lib/i18n'
import Link from 'next/link'
import { localePrefix } from '@/lib/i18n'
import { getHomeDict } from '@/lib/i18n-home'
import Icon from './Icon'
import SectionHeader from './SectionHeader'
import SectionLabel from './SectionLabel'

/** `worma diff` 的一行变更（字段与 `SourceChange` 对齐）。 */
interface ChangeRow {
  op: '+' | '-' | '~'
  kind: string
  target: string
  item?: string
  detail?: string
  level: 'breaking' | 'additive' | 'doc'
  affects?: string[]
}

const changeRows: ChangeRow[] = [
  { op: '+', kind: 'api', target: 'GET /pets', level: 'additive' },
  { op: '-', kind: 'api', target: 'DELETE /pets/{petId}', level: 'breaking' },
  { op: '~', kind: 'param', target: 'GET /pets', item: 'query.status.enum', detail: '+ "sold"', level: 'additive' },
  { op: '~', kind: 'comp', target: '#/components/schemas/Pet', detail: 'property "tag" required', level: 'breaking', affects: ['GET /pets', 'POST /pets'] },
  { op: '~', kind: 'resp', target: 'GET /store/order', item: '200.schema.status', detail: '+ "delivered"', level: 'doc' },
]

const opClasses: Record<ChangeRow['op'], string> = {
  '+': 'text-green-400',
  '-': 'text-red-400',
  '~': 'text-amber-400',
}

const levelClasses: Record<ChangeRow['level'], string> = {
  breaking: 'border-red-400/40 text-red-400',
  additive: 'border-green-400/40 text-green-400',
  doc: 'border-outline text-on-surface-variant',
}

/**
 * 更新记录（Change Records）：生成时列出 OpenAPI 变更点，
 * 右侧以 `worma gen` + `worma diff latest` 的真实输出形态呈现。
 */
export default function ChangeLog({ lang }: { lang: Locale }) {
  const t = getHomeDict(lang).changeLog

  return (
    <section className="tech-border-b bg-background relative overflow-hidden">
      <SectionLabel>{t.sectionLabel}</SectionLabel>
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* 左：价值说明 */}
        <div className="lg:col-span-4 p-8 lg:p-12 lg:tech-border-r flex flex-col justify-center relative">
          <SectionHeader label={t.label} title={t.title} />
          <p className="font-data-mono text-primary text-xs mt-6 leading-relaxed">{t.punch}</p>
          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed mt-4">{t.desc}</p>
          <div className="mt-8 flex flex-col gap-3">
            <div className="flex gap-3 items-start">
              <span className="font-data-mono text-[10px] text-primary tracking-widest shrink-0">WHAT //</span>
              <span className="font-data-mono text-[11px] text-on-surface-variant leading-relaxed">{t.what}</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="font-data-mono text-[10px] text-primary tracking-widest shrink-0">WHY //</span>
              <span className="font-data-mono text-[11px] text-on-surface-variant leading-relaxed">{t.why}</span>
            </div>
          </div>
          <Link
            href={`${localePrefix(lang)}/docs/cli-commands#worma-diff`}
            className="mt-10 inline-flex items-center gap-2 text-primary hover:text-white transition-colors font-data-mono text-xs uppercase tracking-widest"
          >
            {t.docLink}
            <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </div>

        {/* 右：终端形态的变更输出 */}
        <div className="lg:col-span-8 p-6 lg:p-12 bg-surface/30 relative overflow-x-auto">
          <div className="min-w-[640px] tech-border bg-editor-bg font-data-mono">
            <div className="flex items-center justify-between px-4 py-2 bg-editor-titlebar tech-border-b">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-window-control" />
                <div className="w-2.5 h-2.5 rounded-full bg-window-control" />
                <div className="w-2.5 h-2.5 rounded-full bg-window-control" />
              </div>
              <div className="text-[10px] text-on-surface-variant">{t.diffCommand}</div>
              <div className="w-10" />
            </div>

            {/* worma gen 输出：生成时即报告变更 */}
            <div className="px-4 py-3 tech-border-b text-[11px] leading-relaxed">
              <div className="text-on-surface">{t.genCommand}</div>
              <div className="text-green-400 mt-1">{t.recordedLine}</div>
              <div className="text-on-surface-variant mt-0.5">{t.hint}</div>
            </div>

            {/* worma diff latest 明细 */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[11px] text-on-surface">{t.changeId}</span>
                <span className="border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary uppercase tracking-widest">{t.latest}</span>
                <span className="ml-auto text-[10px] text-on-surface-variant">{t.timestamp}</span>
              </div>
              <div className="text-[10px] text-primary mb-3">{t.groupTitle}</div>

              <div className="flex items-center gap-3 tech-border-b pb-1.5 text-[9px] text-on-surface-variant uppercase tracking-widest">
                <span className="w-3" />
                <span className="w-12">{t.columns.type}</span>
                <span className="flex-1">{t.columns.target}</span>
                <span className="w-44 hidden md:block">{t.columns.change}</span>
                <span className="w-20 text-right">{t.columns.level}</span>
              </div>

              {changeRows.map((row, index) => (
                <div key={index} className="tech-border-b py-2 text-[11px]">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 font-bold ${opClasses[row.op]}`}>{row.op}</span>
                    <span className="w-12 text-on-surface-variant">{row.kind}</span>
                    <span className="flex-1 text-on-surface truncate">
                      {row.target}
                      {row.item && <span className="text-on-surface-variant">{` · ${row.item}`}</span>}
                    </span>
                    <span className="w-44 hidden md:block text-on-surface-variant truncate">{row.detail}</span>
                    <span className="w-20 text-right">
                      <span className={`inline-block border px-1.5 py-0.5 text-[9px] ${levelClasses[row.level]}`}>{row.level}</span>
                    </span>
                  </div>
                  {row.affects && (
                    <div className="pl-6 mt-1 text-[10px] text-on-surface-variant">
                      {`${t.affectsLabel}: ${row.affects.join(', ')}`}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-3 text-[11px]">
                <span className="text-on-surface-variant">{`${t.totals.label}: `}</span>
                <span className="text-green-400">{`+1 ${t.totals.added}`}</span>
                <span className="text-on-surface-variant">{', '}</span>
                <span className="text-red-400">{`-1 ${t.totals.removed}`}</span>
                <span className="text-on-surface-variant">{', '}</span>
                <span className="text-amber-400">{`~3 ${t.totals.modified}`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
