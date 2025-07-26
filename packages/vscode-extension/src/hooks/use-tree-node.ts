import type { TreeInst, TreeOption } from 'naive-ui'
import type { MatchingConfig } from 'sdm2'
import { match } from 'sdm2'

interface MatchOptions<N extends TreeOption> extends MatchingConfig<string> {
  onMatch: (node: N) => string[]
}

export class TreeHelper<N extends TreeOption> {
  private listenerId = 0
  private listenersHover: Map<number, (value: string) => void> = new Map()
  private hoverDone: MaybeNull<(target: HTMLElement, setHover: (value: string) => void) => void> = null
  normalizeTree(node: N) {
    for (const child of node.children ?? []) {
      this.normalizeTree(child as N)
    }
    if (node.children?.length === 1) {
      const child = node.children[0]
      if (child?.children?.length) {
        node.children = child.children
        this.normalizeTree(node)
      }
    }
    return node
  }

  match(pattern: string, node: N, options: MatchOptions<N>) {
    const strings = options.onMatch(node)
    return match(strings.join('\n'), pattern, {
      ...options,
      onMatched(matchedStr, origin) {
        return matchedStr.split('\n').map((line) => {
          if (!options.onMatched) {
            return line
          }
          return options.onMatched(line, origin)
        }).join('\n')
      },
    })
  }

  onHover(listener: (value: string) => void) {
    const id = this.listenerId++
    this.listenersHover.set(id, listener)
    return () => {
      this.listenersHover.delete(id)
    }
  }

  offHover() {
    this.listenersHover.clear()
  }

  setupHover(done: (target: HTMLElement, setHover: (value: string) => void) => void) {
    this.hoverDone = done
    return this
  }

  handleMouseLeave = () => {
    this.listenersHover.forEach(v => v(''))
  }

  handleMouseMove = (e: MouseEvent) => {
    const dom = e.target as HTMLElement | null
    if (!dom) {
      return
    }
    this.hoverDone?.(dom, useDebounceFn((value: string) => {
      this.listenersHover.forEach(v => v(value))
    }, 100))
  }

  getNodeById(id: string, data: N[], path: Set<string> = new Set()) {
    let result: MaybeNull<N> = null
    let keys: string[] = []
    for (const node of data) {
      if (node.key) {
        path.add(`${node.key}`)
      }
      if (node.key === id) {
        result = node
        keys = [...path]
        break
      }
      if (node.children?.length) {
        const { result: nextResult, keys: nextKeys } = this.getNodeById(
          id,
          node.children as N[],
          path,
        )
        result = nextResult
        keys = nextKeys
      }
      if (result) {
        break
      }
      path.delete(`${node.key}`)
      keys = []
    }
    return {
      result,
      keys,
    } as {
      result: MaybeNull<N>
      keys: string[]
    }
  }
}
export interface UseTreeNodeOptions {
  setSelectedKeys?: (key: string[]) => void
  setExpandedKeys?: (key: string[]) => void
}
export function useTreeNode(optins: UseTreeNodeOptions) {
  const treeHelper = new TreeHelper()
  const treeRef = ref<TreeInst | null>(null)
  const treeKey = ref(0)
  onUnmounted(() => {
    treeHelper.offHover()
  })
  function selectNode(key: string, data: TreeOption[]) {
    const { result, keys } = treeHelper.getNodeById(key, data)
    if (result) {
      optins.setSelectedKeys?.([key])
      optins.setExpandedKeys?.(keys)
      treeRef.value?.scrollTo({ key })
      nextTick(() => {
        treeKey.value++
      })
    }
  }
  return {
    treeHelper,
    treeRef,
    treeKey,
    selectNode,
  }
}
