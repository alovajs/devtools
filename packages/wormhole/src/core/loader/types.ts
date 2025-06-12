export interface Loader<T, U, O> {
  name: string;
  transform: (data: T, options: O) => U;
}
