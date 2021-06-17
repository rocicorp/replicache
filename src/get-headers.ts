export function getHeaders(arg: {auth: string; requestID: string}): {
  [key: string]: string;
} {
  /* eslint-disable @typescript-eslint/naming-convention */
  return {
    'Content-type': 'application/json',
    Authorization: arg.auth,
    'X-Replicache-RequestID': arg.requestID,
  };
  /* eslint-disable @typescript-eslint/naming-convention */
}
