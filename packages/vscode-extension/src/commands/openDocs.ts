// Show status bar items
import { utils } from '@/components/apiDocs';

export default {
  commandId: 'alova.openDocs',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: context => async (url: string) => {
    utils.openApiDocs(url);
  }
} as Commonand;
