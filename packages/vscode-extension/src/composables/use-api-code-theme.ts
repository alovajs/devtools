import { onMounted, onUnmounted } from 'vue'
import { useHandlers } from '~/hooks/use-handlers'

const STYLE_ID = 'api-code-theme'

export function useApiCodeTheme() {
  const handlers = useHandlers()

  async function updateCss() {
    try {
      const css = await handlers.getThemeSyntaxColors()
      let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
      if (!style) {
        style = document.createElement('style')
        style.id = STYLE_ID
      }
      style.textContent = css
      // Keep the theme style last so its :root variables win over any other sheets
      document.head.appendChild(style)
    }
    catch (error) {
      console.error('Failed to update API code theme:', error)
    }
  }

  onMounted(() => {
    updateCss()

    let dispose: (() => void) | undefined
    handlers.onThemeChange({
      next: () => updateCss(),
    }).then((d) => {
      dispose = d
    })

    onUnmounted(() => {
      dispose?.()
    })
  })
}
