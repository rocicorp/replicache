export interface Store {
  read(): Promise<Read>;
  write(): Promise<Write>;
  close(): Promise<void>;
}

export interface Drop {
  drop(): void;
}

export interface Read {
  has(key: string): Promise<boolean>;
  get(key: string): Promise<Uint8Array | undefined>;
}

export interface Write extends Read {
  put(key: string, value: Uint8Array): Promise<void>;
  del(key: string): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface Release {
  release(): void;
}
