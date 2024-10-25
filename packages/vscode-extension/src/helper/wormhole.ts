import getWormhole from '@/functions/getWormhole';

const wormhole = getWormhole();
const { setGlobalConfig, readConfig, createConfig, generate, getApis, getAutoUpdateConfig } = wormhole;
export { setGlobalConfig, readConfig, createConfig, generate, getApis, getAutoUpdateConfig };
export default wormhole;
