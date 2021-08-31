export {Map} from './map';

// TODO(arv): Replace this with [key: Uint8Array, value: Uint8Array]
export type Entry = {
  // TODO(arv): Use string instead of Uint8Array
  key: Uint8Array;
  val: Uint8Array;
};
