import { i18n } from '~/plugins/i18n'

export function handleCopy(code: string) {
  const t = i18n.global.t
  const { copy, copied } = useClipboard({ legacy: true })
  copy(code).then(() => {
    if (copied.value) {
      globalThis.$message.success(t('api-info.copy-success'))
    }
    else {
      globalThis.$message.error(t('api-info.copy-fail'))
    }
  })
}
