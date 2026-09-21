<script setup lang="ts">
import type { Change, ChangeSummary } from 'wormajs'
import { computed, onMounted, ref } from 'vue'
import { useHandlers } from '~/hooks/use-handlers'
import { getWebViewUrl } from '~/utils/vscode'

defineOptions({
  name: 'ApiChangesPage',
})

const handlers = useHandlers()

const { query } = getWebViewUrl()
const projectPath = (query?.projectPath as string) ?? ''
const selectedId = ref<string>((query?.changeId as string) ?? 'latest')

const summaries = ref<ChangeSummary[]>([])
const change = ref<Change | undefined>()
const loading = ref(false)
const search = ref('')

interface ChangeRow {
  op: string
  kind: string
  target: string
  item?: string
  detail?: string
  level: string
  affects?: string[]
}

function searchableText(row: ChangeRow): string {
  return [row.op, row.kind, row.target, row.item, row.detail, row.level, ...(row.affects ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const filteredGenerators = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!change.value)
    return []
  return change.value.generators.map((gen) => {
    const rows = q
      ? gen.changes.filter(row => searchableText(row as ChangeRow).includes(q))
      : gen.changes
    return { ...gen, changes: rows }
  })
})

const shownCount = computed(() =>
  filteredGenerators.value.reduce((sum, g) => sum + g.changes.length, 0),
)
const totalCount = computed(() =>
  change.value ? change.value.generators.reduce((sum, g) => sum + g.changes.length, 0) : 0,
)

const recordOptions = computed(() =>
  summaries.value.map(s => ({
    label: `${s.id} — ${formatTime(s.createdAt)} (+${s.summary.added}/-${s.summary.removed}/~${s.summary.modified})`,
    value: s.id,
  })),
)

function rowClass(op: string) {
  if (op === '+')
    return 'add'
  if (op === '-')
    return 'del'
  return 'mod'
}
function levelClass(level: string) {
  if (level === 'breaking')
    return 'breaking'
  if (level === 'additive')
    return 'additive'
  return 'doc'
}
function formatTime(ts: number) {
  return new Date(ts).toLocaleString()
}
function formatSummary(c: Change): string {
  let added = 0
  let removed = 0
  let modified = 0
  for (const gen of c.generators) {
    for (const row of gen.changes) {
      if (row.op === '+')
        added++
      else if (row.op === '-')
        removed++
      else
        modified++
    }
  }
  const parts: string[] = []
  if (added)
    parts.push(`${added} added`)
  if (removed)
    parts.push(`${removed} removed`)
  if (modified)
    parts.push(`${modified} modified`)
  return parts.length ? parts.join(', ') : 'no changes'
}

async function loadSummaries() {
  summaries.value = (await handlers.listChanges(projectPath)) as ChangeSummary[]
}
async function loadChange(id: string) {
  loading.value = true
  try {
    change.value = (await handlers.getChange(projectPath, id)) as Change | undefined
    // When the host asked for "latest", pin the dropdown to the concrete record
    // so that subsequent deletions use a real id instead of the alias.
    if (id === 'latest' && change.value?.id)
      selectedId.value = change.value.id
  }
  finally {
    loading.value = false
  }
}
async function onSelect(id: string) {
  selectedId.value = id
  await loadChange(id)
}
async function onDelete() {
  const id = selectedId.value === 'latest' && change.value?.id ? change.value.id : selectedId.value
  // Capture the index in the current list before it is reloaded below.
  const idx = recordOptions.value.findIndex(o => o.value === id)
  const removed = await handlers.removeChange(projectPath, id)
  if (!removed)
    return
  await loadSummaries()
  const opts = recordOptions.value
  let nextId: string
  if (opts.length === 0) {
    // Nothing left to show.
    nextId = 'latest'
  }
  else if (idx >= 0 && idx >= opts.length) {
    // Deleted the last record → show the previous one (now the last).
    nextId = opts[opts.length - 1].value
  }
  else {
    // Show the record that followed the deleted one (fallback to the first).
    nextId = opts[idx >= 0 ? idx : 0].value
  }
  selectedId.value = nextId
  await loadChange(nextId)
}

onMounted(async () => {
  await loadSummaries()
  await loadChange(selectedId.value)
})
</script>

<template>
  <div class="api-changes">
    <n-space align="center" class="toolbar" :wrap="false">
      <n-select
        v-model:value="selectedId"
        :options="recordOptions"
        :loading="loading"
        placeholder="Select a record"
        class="record-select"
        @update:value="onSelect"
      />
      <n-input
        v-model:value="search"
        placeholder="Search by type / target / item / change ..."
        clearable
        class="search-input"
      />
      <n-button type="error" :disabled="!change" @click="onDelete">
        Delete
      </n-button>
      <span v-if="search && totalCount" class="count dim">{{ shownCount }} / {{ totalCount }}</span>
    </n-space>

    <template v-if="change">
      <h2>{{ change.id }} <span class="dim">{{ formatTime(change.createdAt) }}</span></h2>
      <p class="summary">
        {{ formatSummary(change) }}
      </p>

      <section
        v-for="gen in filteredGenerators"
        :key="gen.output + (gen.serverName ?? '')"
        class="group"
      >
        <h3>
          {{ gen.output }}
          <span v-if="gen.serverName" class="dim">({{ gen.serverName }})</span>
        </h3>
        <n-table :single-line="false" class="changes-table">
          <thead>
            <tr><th /><th>Type</th><th>Target</th><th>Item</th><th>Change</th><th>Level</th></tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in gen.changes"
              :key="i"
              class="row"
              :class="rowClass(row.op)"
            >
              <td class="badge" :class="rowClass(row.op)">
                {{ row.op }}
              </td>
              <td class="type">
                {{ row.kind }}
              </td>
              <td>{{ row.target }}</td>
              <td>{{ row.item ?? '' }}</td>
              <td>
                <template v-if="row.detail">
                  {{ row.detail }}
                </template>
                <div v-for="(a, ai) in (row.affects ?? [])" :key="ai" class="affects">
                  {{ a }}
                </div>
              </td>
              <td class="level" :class="levelClass(row.level)">
                {{ row.level }}
              </td>
            </tr>
            <tr v-if="!gen.changes.length">
              <td colspan="6" class="dim">
                no changes
              </td>
            </tr>
          </tbody>
        </n-table>
      </section>
    </template>

    <n-empty
      v-else-if="!loading"
      description="No change records yet. Run Worma: Generate APIs after your spec changes."
    />
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
</route>

<style scoped>
.api-changes {
  /* Fill the webview viewport and scroll internally. The outer layout's <main>
     is h-screen but not a scroll container, and the naive-ui provider wrappers
     have auto height, so `height: 100%` would not resolve — use 100vh. */
  height: 100vh;
  box-sizing: border-box;
  overflow: auto;
  padding: 12px 16px;
  font-size: 12px;
}
h2 {
  font-size: 14px;
  margin: 8px 0 2px;
}
h3 {
  font-size: 13px;
  margin: 16px 0 6px;
}
.toolbar {
  margin-bottom: 10px;
}
.record-select {
  min-width: 300px;
}
.search-input {
  flex: 1;
}
.dim {
  color: var(--vscode-descriptionForeground);
}
.summary {
  margin: 0 0 8px;
  font-weight: 600;
}
.changes-table {
  font-size: 12px;
}
.badge {
  width: 16px;
  font-weight: 700;
}
/* Only the symbol (per op) and the level (per severity) are coloured, matching
   the worma diff table; every other cell stays on the default foreground. */
.badge.add {
  color: var(--vscode-gitDecoration-addedResourceForeground, #81b88b);
}
.badge.del {
  color: var(--vscode-gitDecoration-deletedResourceForeground, #c74e39);
}
.badge.mod {
  color: var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d);
}
.type,
.level.doc {
  color: var(--vscode-descriptionForeground);
}
.level.breaking {
  color: var(--vscode-gitDecoration-deletedResourceForeground, #c74e39);
}
.level.additive {
  color: var(--vscode-gitDecoration-addedResourceForeground, #81b88b);
}
.affects {
  padding-left: 10px;
}
.count {
  font-size: 12px;
}
</style>
