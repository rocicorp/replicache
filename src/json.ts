type JsonTypePrimitves =
  | null
  | string
  | boolean
  | number
  | Array<JsonType>
  // undefined are filtered out in JSON.stringify so OK to allow.
  | {[key: string]: JsonType | undefined};

type ToJsonType = {
  (): JsonTypePrimitves;
};

export type JsonType = JsonTypePrimitves | ToJsonType;
