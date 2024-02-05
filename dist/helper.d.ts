/// <reference types="node" />
declare const decodeLabel: (tag: Buffer) => string;
declare const encodeLabel: (tag: string) => Buffer;
export { decodeLabel, encodeLabel };
