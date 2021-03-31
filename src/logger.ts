/**
 * A logger interface exposing optional [[error]], [[info]] and [[debug]]
 * methods. The idea is that these gets filled in based on the [[LogLevel]]. If
 * [[LogLevel]] is 'debug' then all three should be present, if it is 'info',
 * then [[error]] and [[info]] should be present and if [[LogLevel]] is 'error'
 * only [[error]] will be present.
 */
export interface Logger {
  error?(...args: unknown[]): void;
  info?(...args: unknown[]): void;
  debug?(...args: unknown[]): void;
}

/**
 * The different log levels. This is used to determine how much logging to do.
 * `'error'` > `'info'` > `'debug'`... meaning `'error'` has highest priority
 * and `'debug'` lowest.
 */
export type LogLevel = 'error' | 'info' | 'debug';

export function getLogger(prefix: string[], level: LogLevel): Logger {
  const logger: Logger = {};
  const impl = (name: 'debug' | 'log' | 'error') => (...args: unknown[]) =>
    console[name](...prefix, ...args);
  switch (level) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line no-fallthrough
    case 'debug':
      logger.debug = impl('debug');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line no-fallthrough
    case 'info':
      // Use log instead of info because that is what repc uses.
      logger.info = impl('log');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line no-fallthrough
    case 'error':
      logger.error = impl('error');
  }
  return logger;
}
