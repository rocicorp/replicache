export const BYTE_LENGTH = 20;

const charTable = '0123456789abcdefghijklmnopqrstuv';

export class Hash {
  private readonly _sum: Uint8Array;

  constructor(sum: Uint8Array) {
    this._sum = sum;
  }

  static async of(sum: Uint8Array): Promise<Hash> {
    const buffer = await crypto.subtle.digest('SHA-512', sum);
    return new Hash(new Uint8Array(buffer, 0, BYTE_LENGTH));
  }

  isEmpty(): boolean {
    for (const i of this._sum) {
      if (i !== 0) {
        return false;
      }
    }
    return true;
  }

  toString(): string {
    return encode(this._sum);
  }

  equals(other: Hash): boolean {
    for (const i of this._sum) {
      if (i !== other._sum[i]) {
        return false;
      }
    }
    return true;
  }

  static empty(): Hash {
    return new Hash(new Uint8Array(BYTE_LENGTH));
  }

  static parse(s: string): Hash {
    const sum = decode(s);
    return new Hash(sum);
  }
}

function encode(plain: Uint8Array): string {
  let i = 0;
  let shiftIndex = 0;
  let digit = 0;
  let encoded = '';

  // byte by byte isn't as pretty as quintet by quintet but tests a bit
  // faster. will have to revisit.
  while (i < BYTE_LENGTH) {
    const current = plain[i];

    if (shiftIndex > 3) {
      digit = current & (0xff >> shiftIndex);
      shiftIndex = (shiftIndex + 5) % 8;
      digit =
        (digit << shiftIndex) |
        ((i + 1 < BYTE_LENGTH ? plain[i + 1] : 0) >> (8 - shiftIndex));
      i++;
    } else {
      digit = (current >> (8 - (shiftIndex + 5))) & 0x1f;
      shiftIndex = (shiftIndex + 5) % 8;
      if (shiftIndex === 0) {
        i++;
      }
    }

    encoded += charTable[digit];
  }

  // No padding!
  return encoded;
}

function decode(encoded: string): Uint8Array {
  let shiftIndex = 0;
  let plainChar = 0;
  let plainPos = 0;
  const decoded = new Uint8Array(BYTE_LENGTH);

  // byte by byte isn't as pretty as octet by octet but tests a bit faster. will have to revisit.
  for (let i = 0; i < encoded.length; i++) {
    const plainDigit = charCodeToNum(encoded.charCodeAt(i));

    if (shiftIndex <= 3) {
      shiftIndex = (shiftIndex + 5) % 8;

      if (shiftIndex === 0) {
        decoded[plainPos++] = plainChar | plainDigit;
        plainChar = 0;
      } else {
        plainChar |= 0xff & (plainDigit << (8 - shiftIndex));
      }
    } else {
      shiftIndex = (shiftIndex + 5) % 8;
      decoded[plainPos++] = plainChar | (0xff & (plainDigit >>> shiftIndex));
      plainChar = 0xff & (plainDigit << (8 - shiftIndex));
    }
  }
  return decoded;
}

function charCodeToNum(cc: number): number {
  // This only accepts the char code for '0' - '9', 'a' - 'v'
  return cc - (cc <= 57 ? 48 : 87); // '9', '0', 'a' - 10
}
