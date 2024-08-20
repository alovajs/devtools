declare type GeneratorConfig = import('@/wormhole').GeneratorConfig;
declare type AlovaConfig = import('@/wormhole').Config;
declare interface Commonand {
  commandId: string;
  handler: (context: import('vscode').ExtensionContext) => <T = void, U = []>(...args: U) => T | Promise<T>;
}
type UnionToIntersection<U> = (U extends any ? (x: U) => any : never) extends (x: infer R) => any ? R : never;

type LastOf<T> =
  UnionToIntersection<T extends any ? (x: T) => any : never> extends (x: infer Last) => any ? Last : never;

declare type UnionToTuple<T, L = LastOf<T>, N = [T] extends [never] ? true : false> = true extends N
  ? []
  : [...UnionToTuple<Exclude<T, L>>, L];
