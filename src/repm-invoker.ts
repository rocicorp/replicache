export function assertHTTPRequestInfo(
  // eslint-disable-next-line
  v: any,
): asserts v is HTTPRequestInfo {
  if (
    typeof v !== 'object' ||
    v === null ||
    typeof v.httpStatusCode !== 'number' ||
    typeof v.errorMessage !== 'string'
  ) {
    throw new Error('Invalid HTTPRequestInfo');
  }
}

export type HTTPRequestInfo = {
  httpStatusCode: number;
  errorMessage: string;
};
