export function resolver<R = void>(): {
  promise: Promise<R>;
  resolve: (res: R) => void;
} {
  let resolve!: (res: R) => void;
  const promise = new Promise<R>(res => {
    resolve = res;
  });
  return {promise, resolve};
}
