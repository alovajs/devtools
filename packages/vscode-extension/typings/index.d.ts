declare interface CommandType<U = [], T = void> {
  commandId: string;
  handler: (context: import('vscode').ExtensionContext) => (...args: U) => T | Promise<T>;
}
type UnionToIntersection<U> = (U extends any ? (x: U) => any : never) extends (x: infer R) => any ? R : never;

type LastOf<T> =
  UnionToIntersection<T extends any ? (x: T) => any : never> extends (x: infer Last) => any ? Last : never;

declare type UnionToTuple<T, L = LastOf<T>, N = [T] extends [never] ? true : false> = true extends N
  ? []
  : [...UnionToTuple<Exclude<T, L>>, L];
type Modify<T, R> = Omit<T, keyof R> & R;
