export const commandKeys = ['refresh'] as const;
export const commandMap: Record<(typeof commandKeys)[number], Omit<Commonand, 'handler'>> = {
  refresh: {
    commandId: 'alova.apiDocs.refresh'
  }
};
