import type { MDXComponents } from 'mdx/types'
import { Step, Steps } from 'fumadocs-ui/components/steps'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import defaultComponents from 'fumadocs-ui/mdx'
import { Mermaid } from '@/components/mdx/mermaid'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultComponents,
    Tab,
    Tabs,
    Steps,
    Step,
    Mermaid,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
