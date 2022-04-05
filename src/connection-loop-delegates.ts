import type {ConnectionLoopDelegate} from './connection-loop';
import type {OptionalLogger} from '@rocicorp/logger';
import type {ReplicacheInternal} from './replicache-internal';

export class ConnectionLoopDelegateImpl implements OptionalLogger {
  readonly rep: ReplicacheInternal;
  readonly invokeSend: () => Promise<boolean>;
  readonly logger: OptionalLogger;
  readonly maxConnections = 1;

  constructor(
    rep: ReplicacheInternal,
    invokeSend: () => Promise<boolean>,
    logger: OptionalLogger,
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
