// Show status bar items
import { utils } from '@/components/apiDocs';
import { Commands } from './commands';

export default <CommandType>{
  commandId: Commands.api_docs_open,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: context => async (url: string) => {
    utils.openApiDocs(url);
  }
};
