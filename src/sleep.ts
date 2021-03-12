export function sleep(ms: number): Promise<void> {
  // TODO: Consider making this a noop if 0? Right now, passing 0 cause the
  // promise to resolve in the next task (macro not micro).
  return new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });
}
