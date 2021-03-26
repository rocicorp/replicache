export interface Logger {
  error?(...args: unknown[]): void;
  info?(...args: unknown[]): void;
  debug?(...args: unknown[]): void;
}

export type LogLevel = 'info' | 'debug' | 'error';

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
