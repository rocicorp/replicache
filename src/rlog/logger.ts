import type {Logger, LogLevel} from '../logger';

export class LogContext implements Logger {
  private readonly _s;

  readonly debug?: (...args: unknown[]) => void = undefined;
  readonly info?: (...args: unknown[]) => void = undefined;
  readonly error?: (...args: unknown[]) => void = undefined;

  constructor(level: LogLevel = 'info', s = '') {
    this._s = s;

    /* eslint-disable no-fallthrough , @typescript-eslint/ban-ts-comment */
    switch (level) {
      // @ts-ignore
      case 'debug':
        this.debug = (...args: unknown[]): void =>
          console.debug(this._s, ...args);
      // @ts-ignore
      case 'info':
        this.info = (...args: unknown[]): void =>
          console.info(this._s, ...args);
      case 'error':
        this.error = (...args: unknown[]): void =>
          console.error(this._s, ...args);
    }
    /* eslint-ensable @typescript-eslint/ban-ts-comment, no-fallthrough */
  }

  addContext(key: string, value: unknown): LogContext {
    return new LogContext(this._logLevel, `${this._s}${key}=${value} `);
  }

  private get _logLevel(): LogLevel {
    return this.debug ? 'debug' : this.info ? 'info' : 'error';
  }
}
