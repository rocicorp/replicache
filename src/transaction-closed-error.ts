/**
 * This error is thrown when you try to call methods on a closed transaction.
 */
export class TransactionClosedError extends Error {
  constructor() {
    super('Transaction is closed');
  }
}

export function throwIfClosed(tx: {closed: boolean}): void {
  if (tx.closed) {
    throw new TransactionClosedError();
  }
}
