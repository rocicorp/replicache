import type {ConnectionLoopDelegate} from './connection-loop';
import type {Logger} from './logger';
import type {Replicache} from './replicache';

export class ConnectionLoopDelegateImpl implements Logger {
  readonly rep: Replicache;
  readonly invokeSend: () => Promise<boolean>;
  readonly logger: Logger;
  readonly maxConnections = 1;

  constructor(
    rep: Replicache,
    invokeSend: () => Promise<boolean>,
    logger: Logger,
  ) {
    this.rep = rep;
    this.invokeSend = invokeSend;
    this.logger = logger;
  }

  get maxDelayMs(): number {
    return this.rep.requestOptions.maxDelayMs;
  }

  get minDelayMs(): number {
    return this.rep.requestOptions.minDelayMs;
  }

  get debug(): ((...args: unknown[]) => void) | undefined {
    return this.logger.debug;
  }
}

export class PullDelegate
  extends ConnectionLoopDelegateImpl
  implements ConnectionLoopDelegate
{
  readonly debounceDelay = 0;

  get watchdogTimer(): number | null {
    return this.rep.pullInterval;
  }
}

export class PushDelegate
  extends ConnectionLoopDelegateImpl
  implements ConnectionLoopDelegate
{
  get debounceDelay(): number {
    return this.rep.pushDelay;
  }

  watchdogTimer = null;
}
