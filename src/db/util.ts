const textEncoder = new TextEncoder();

export function stringToUint8Array(str: string): Uint8Array {
  return textEncoder.encode(str);
}
