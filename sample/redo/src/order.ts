import type {Todo} from './App';
import {generateKeyBetween} from 'fractional-indexing';

export {generateKeyBetween as newOrder};

export function newOrderBetween(left: Todo | null, right: Todo | null): string {
  const leftOrder = left?.order ?? null;
  const rightOrder = right?.order ?? null;
  return generateKeyBetween(leftOrder, rightOrder);
}
