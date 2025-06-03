export const commandKeys = ['addItem', 'refresh', 'editItem', 'deleteItem'] as const;
export const commandMap: Record<(typeof commandKeys)[number], Omit<Commonand, 'handler'>> = {
  addItem: {
    commandId: 'alova.apiDocs.addItem'
  },
  refresh: {
    commandId: 'alova.apiDocs.refresh'
  },
  editItem: {
    commandId: 'alova.apiDocs.editItem'
  },
  deleteItem: {
    commandId: 'alova.apiDocs.deleteItem'
  }
};
