import type {Todo} from './App';

export function newOrder(before: number | null, after: number | null) {
  const minOrderValue = 0;
  const maxOrderValue = Number.MAX_SAFE_INTEGER;
  if (before === null) {
    before = minOrderValue;
  }
  if (after === null) {
    after = maxOrderValue;
  }
  return before + (after - before) / 2;
}
/**
 * calculates the order field by halving the distance between the left and right
 * neighbor orders.
 * min default value = -minPositive
 * max default value = Number.MAX_SAFE_INTEGER
 */
export function newOrderBetween(left: Todo | null, right: Todo | null) {
  const leftOrder = left?.order ?? null;
  const rightOrder = right?.order ?? null;
  return newOrder(leftOrder, rightOrder);
}
