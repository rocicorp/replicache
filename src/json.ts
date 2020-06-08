export type JSONValue =
  | null
  | string
  | boolean
  | number
  | Array<JSONValue>
  // undefined are filtered out in JSON.stringify so OK to allow.
  | {[key: string]: JSONValue | undefined};

export type ToJSON = {
  toJSON: () => JSONValue;
};
