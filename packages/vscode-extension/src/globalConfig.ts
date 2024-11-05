import { AlovaErrorConstructor } from '@/components/error';
import { log } from '@/components/message';
import wormhole from '@/helper/wormhole';
// 全局配置
wormhole.setGlobalConfig({
  log,
  Error: AlovaErrorConstructor
});
