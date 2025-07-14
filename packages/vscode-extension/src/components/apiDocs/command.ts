import { Commands } from '@/commands'

export const commandKeys = ['refresh'] as const
export const commandMap: Record<(typeof commandKeys)[number], Omit<CommandType, 'handler'>> = {
  refresh: {
    commandId: Commands.api_docs_refresh,
  },
}
