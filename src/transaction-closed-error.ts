export class TransactionClosedError extends Error {
  constructor() {
    super('Transaction is closed');
  }
}
