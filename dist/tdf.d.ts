/// <reference types="node" />
/// <reference types="node" />
import { Readable } from 'stream';
declare enum TDFType {
    Integer = 0,
    String = 1,
    Blob = 2,
    Struct = 3,
    List = 4,
    Dictionary = 5,
    Union = 6,
    IntegerList = 7,
    IntVector2 = 8,
    IntVector3 = 9,
    Unknown = -1
}
declare abstract class TDF {
    label: string;
    type: TDFType;
    value?: any;
    static readTDF(stream: Readable): TDFInteger | TDFString | TDFBlob | TDFStruct | TDFList | TDFDictionary | TDFUnion | TDFIntegerList | TDFIntVector2 | TDFIntVector3;
}
declare class TDFInteger extends TDF {
    value: number;
    static readInteger(stream: Readable): number;
    constructor(label: string, stream: Readable);
}
declare class TDFString extends TDF {
    value: string;
    constructor(label: string, stream: Readable);
    static readString(stream: Readable): any;
    static writeString(stream: Readable, string: string): void;
}
declare class TDFBlob extends TDF {
    value: Buffer;
    constructor(label: string, stream: Readable);
}
declare class TDFStruct extends TDF {
    value: TDF[];
    static readStruct(stream: Readable): TDF[];
    constructor(label: string, stream: Readable);
}
declare class TDFList extends TDF {
    value: any[];
    constructor(label: string, stream: Readable);
}
declare class TDFDictionary extends TDF {
    value: any;
    constructor(label: string, stream: Readable);
}
declare class TDFUnion extends TDF {
    value: TDF;
    constructor(label: string, stream: Readable);
}
declare class TDFIntegerList extends TDF {
    value: TDF[];
    constructor(label: string, stream: Readable);
}
declare class TDFIntVector2 extends TDF {
    value: number[];
    constructor(label: string, stream: Readable);
}
declare class TDFIntVector3 extends TDF {
    value: number[];
    constructor(label: string, stream: Readable);
}
export { TDF, TDFType, TDFInteger, TDFString, TDFBlob, TDFStruct, TDFList, TDFDictionary, TDFUnion, TDFIntegerList, TDFIntVector2, TDFIntVector3, };
