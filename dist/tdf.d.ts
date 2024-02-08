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
declare class TDF {
    label: string;
    type: TDFType;
    value?: any;
    static readTDF(stream: Readable): TDF;
}
declare class TDFInteger extends TDF {
    value: number;
    constructor(label: string, value: number);
    static decode(stream: Readable): number;
}
declare class TDFString extends TDF {
    value: string;
    constructor(label: string, value: string);
    static decode(stream: Readable): any;
    static encode(stream: Readable, string: string): void;
}
declare class TDFBlob extends TDF {
    value: Buffer;
    constructor(label: string, value: Buffer);
    static decode(stream: Readable): Buffer;
}
declare class TDFStruct extends TDF {
    value: TDF[];
    constructor(label: string, value: TDF[]);
    static decode(stream: Readable): TDF[];
}
declare class TDFList extends TDF {
    value: any[];
    constructor(label: string, value: any[]);
    static decode(stream: Readable): any[];
}
interface Dictionary {
    [key: string | number]: any;
}
declare class TDFDictionary extends TDF {
    value: Dictionary;
    constructor(label: string, value: Dictionary);
    static decode(stream: Readable): Dictionary;
}
declare class TDFUnion extends TDF {
    value: TDF;
    constructor(label: string, value: TDF);
    static decode(stream: Readable): TDF;
}
declare class TDFIntegerList extends TDF {
    value: TDF[];
    constructor(label: string, value: TDF[]);
    static decode(stream: Readable): void;
}
declare class TDFIntVector2 extends TDF {
    value: number[];
    constructor(label: string, value: number[]);
    static decode(stream: Readable): number[];
}
declare class TDFIntVector3 extends TDF {
    value: number[];
    constructor(label: string, value: number[]);
    static decode(stream: Readable): number[];
}
export { TDF, TDFType, TDFInteger, TDFString, TDFBlob, TDFStruct, TDFList, TDFDictionary, TDFUnion, TDFIntegerList, TDFIntVector2, TDFIntVector3, };
