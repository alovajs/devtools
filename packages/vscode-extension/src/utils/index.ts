/* eslint-disable no-bitwise */
export function highPrecisionInterval(callback: () => void, intervalInMilliseconds: number, immediate = false) {
  let isRunning = true;
  if (immediate) {
    callback();
  }
  const timer = setInterval(callback, intervalInMilliseconds);

  return {
    isRunning() {
      return isRunning;
    },
    clear() {
      isRunning = false;
      clearInterval(timer);
    },
    time: intervalInMilliseconds,
    immediate
  };
}
export const getFileNameByPath = (path: string) => {
  const [, name] = /[/\\]([^/\\]+)([/\\])?$/.exec(path) ?? [];
  return name ?? '';
};
// 生成唯一id
export function uuid() {
  let dt = new Date().getTime();
  const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return id;
}
export function debounce<T extends (...args: any) => any>(func: T, delay: number) {
  let timeout: NodeJS.Timeout;

  return function (...args: Parameters<T>) {
    // 清除上一个计时器
    if (timeout) {
      clearTimeout(timeout);
    }

    // 设置新的计时器，延迟执行传入的函数
    timeout = setTimeout(() => {
      func(...args);
    }, delay);
  } as T;
}
