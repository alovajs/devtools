/**
 * 注意：work.js 子线程不能使用任何vscode模块，
 * work.js只是用来处理数据的，比如动态import等
 * import xxx from "vscode" 不能使用
 * 本文件只是专门提供给work.js使用工具包
 */

/** vscode主线程中不能使用动态import,但是work.js子线程可以使用动态import
 * https://github.com/prettier/prettier-vscode/pull/3016
 * 主线程中使用：alovaWork.importEsmModule("foo") 代替import("foo")
 * @param modulePath 模块路径
 * @returns 模块对象
 */
// 加载ESM 模块
export function loadEsmModule<T>(modulePath: string | URL): Promise<T> {
  return new Function('modulePath', `return import(modulePath);`)(modulePath) as Promise<T>;
}
export default { loadEsmModule };
