/// <reference types="node" />
/// <reference types="node" />
import { Readable } from 'stream';
import { TDF } from './tdf';
declare const _default: {
    decodeLabel: (tag: Buffer) => string;
    encodeLabel: (tag: string) => Buffer;
    decompressInteger: (stream: Readable) => number;
    compressInteger: (value: number) => Buffer;
    readString: (stream: Readable) => string;
    writeString: (value: string) => Buffer;
    readStruct: (stream: Readable) => TDF[];
};
export default _default;
