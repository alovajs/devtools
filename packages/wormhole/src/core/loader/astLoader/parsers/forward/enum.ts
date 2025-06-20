import { Forwarder } from './type';

export default <Forwarder>{
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  is(schema): boolean {
    return true;
  },
  to: 'enum'
};
