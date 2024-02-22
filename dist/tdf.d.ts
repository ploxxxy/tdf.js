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
    value: unknown;
    static readTDF(stream: Readable): TDF;
    formPrefix(): Buffer;
    abstract write(): Buffer;
    static decodeLabel(tag: Buffer): string;
    static encodeLabel(tag: string): Buffer;
}
declare class TDFInteger extends TDF {
    value: number;
    constructor(label: string, value: number);
    static decode(stream: Readable): number;
    static encode(value: number): Buffer;
    static read(label: string, stream: Readable): TDFInteger;
    write(): Buffer;
}
declare class TDFString extends TDF {
    value: string;
    constructor(label: string, value: string);
    static decode(stream: Readable): any;
    static encode(value: string): Buffer;
    static read(label: string, stream: Readable): TDFString;
    write(): Buffer;
}
declare class TDFBlob extends TDF {
    value: Buffer;
    constructor(label: string, value: Buffer);
    static decode(stream: Readable): Buffer;
    static encode(value: Buffer): Buffer;
    static read(label: string, stream: Readable): TDFBlob;
    write(): Buffer;
}
declare class TDFStruct extends TDF {
    value: TDF[];
    constructor(label: string, value: TDF[]);
    static decode(stream: Readable): TDF[];
    static read(label: string, stream: Readable): TDFStruct;
    write(): Buffer;
}
type TDFListValue = number | string | Buffer | TDF[] | number[];
declare class TDFList extends TDF {
    value: TDFListValue[];
    subtype: number;
    length: number;
    constructor(label: string, subtype: TDFType, length: number, value: TDFListValue[]);
    static decode(stream: Readable, subtype: TDFType, length: number): TDFListValue[];
    static read(label: string, stream: Readable): TDFList;
    write(): Buffer;
}
interface Dictionary {
    [key: string | number]: number | string | TDF[];
}
declare class TDFDictionary extends TDF {
    value: Dictionary;
    dictionaryKeyType: TDFType;
    dictionaryValueType: TDFType;
    length: number;
    constructor(label: string, dictionaryKeyType: TDFType, dictionaryValueType: TDFType, length: number, value: Dictionary);
    static decode(stream: Readable, dictionaryKeyType: TDFType, dictionaryValueType: TDFType, length: number): Dictionary;
    static read(label: string, stream: Readable): TDFDictionary;
    write(): Buffer;
}
declare class TDFUnion extends TDF {
    value: TDF;
    unionType: number;
    constructor(label: string, unionType: number, value: TDF);
    static decode(stream: Readable): TDF;
    static read(label: string, stream: Readable): TDFUnion;
    write(): Buffer;
}
declare class TDFIntegerList extends TDF {
    value: number[];
    constructor(label: string, value: number[]);
    static decode(stream: Readable): number[];
    static read(label: string, stream: Readable): TDFIntegerList;
    write(): Buffer;
}
declare class TDFIntVector2 extends TDF {
    value: number[];
    constructor(label: string, value: number[]);
    static decode(stream: Readable): number[];
    static encode(value: number[]): Buffer;
    static read(label: string, stream: Readable): TDFIntVector2;
    write(): Buffer;
}
declare class TDFIntVector3 extends TDF {
    value: number[];
    constructor(label: string, value: number[]);
    static decode(stream: Readable): number[];
    static encode(value: number[]): Buffer;
    static read(label: string, stream: Readable): TDFIntVector3;
    write(): Buffer;
}
export { TDF, TDFBlob, TDFDictionary, TDFIntVector2, TDFIntVector3, TDFInteger, TDFIntegerList, TDFList, TDFString, TDFStruct, TDFType, TDFUnion, };
