import type {Hash} from '../hash';

export function chunkDataKey(hash: Hash): string {
  return `c/${hash}/d`;
}

export function chunkMetaKey(hash: Hash): string {
  return `c/${hash}/m`;
}

export function chunkRefCountKey(hash: Hash): string {
  return `c/${hash}/r`;
}

export function headKey(name: string): string {
  return `h/${name}`;
}
