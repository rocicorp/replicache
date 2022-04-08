// This gets injected by the build script.
declare const __DEV__: boolean;

const isProd = !__DEV__;

export const skipCommitDataAsserts = isProd;

export const skipAssertJSONValue = isProd;

export const skipBTreeNodeAsserts = isProd;
