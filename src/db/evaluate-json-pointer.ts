import type {ReadonlyJSONObject, ReadonlyJSONValue} from '../json';

export function evaluateJSONPointer(
  value: ReadonlyJSONValue,
  pointer: string,
): ReadonlyJSONValue | undefined {
  function parseIndex(s: string): number | undefined {
    if (s.startsWith('+') || (s.startsWith('0') && s.length !== 1)) {
      return undefined;
    }
    return parseInt(s, 10);
  }

  if (pointer === '') {
    return value;
  }
  if (!pointer.startsWith('/')) {
    return undefined;
  }

  const tokens = pointer
    .split('/')
    .slice(1)
    .map(x => x.replace(/~1/g, '/').replace(/~0/g, '~'));

  let target = value;
  for (const token of tokens) {
    let targetOpt;
    if (Array.isArray(target)) {
      const i = parseIndex(token);
      if (i === undefined) {
        return undefined;
      }
      targetOpt = target[i];
    } else if (target === null) {
      return undefined;
    } else if (typeof target === 'object') {
      target = target as ReadonlyJSONObject;
      targetOpt = target[token];
    }
    if (targetOpt === undefined) {
      return undefined;
    }
    target = targetOpt;
  }
  return target;
}
