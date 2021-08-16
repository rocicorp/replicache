export function startsWith<T>(
  needle: ArrayLike<T>,
  haystack: ArrayLike<T>,
): boolean {
  if (needle.length > haystack.length) {
    return false;
  }
  for (let i = 0; i < needle.length; i++) {
    if (needle[i] !== haystack[i]) {
      return false;
    }
  }
  return true;
}
