export const decoder = new TextDecoder();
export const encoder = new TextEncoder();

export type HeadChange = {
  new: string | undefined;
  old: string | undefined;
};

export function toLittleEndian(count: number): Uint8Array {
  if (count < 0 || count > 0xffff) {
    throw new Error('Ref count out of range');
  }
  const buf = new Uint8Array(2);
  buf[0] = count & 0xff;
  buf[1] = (count >> 8) & 0xff;
  return buf;
}

export function fromLittleEndian(buf: Uint8Array): number {
  if (buf.length !== 2) {
    throw new Error('Ref count must be 2 bytes');
  }
  return buf[0] | (buf[1] << 8);
}
