import { AlovaErrorConstructor } from '@/components/error';
import { log } from '@/components/message';
import { setGlobalConfig } from '@/helper/wormhole';
// 全局配置
setGlobalConfig({
  log,
  Error: AlovaErrorConstructor
});
