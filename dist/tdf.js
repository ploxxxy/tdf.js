"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TDFUnion = exports.TDFType = exports.TDFStruct = exports.TDFString = exports.TDFList = exports.TDFIntegerList = exports.TDFInteger = exports.TDFIntVector3 = exports.TDFIntVector2 = exports.TDFDictionary = exports.TDFBlob = exports.TDF = void 0;
var TDFType;
(function (TDFType) {
    TDFType[TDFType["Integer"] = 0] = "Integer";
    TDFType[TDFType["String"] = 1] = "String";
    TDFType[TDFType["Blob"] = 2] = "Blob";
    TDFType[TDFType["Struct"] = 3] = "Struct";
    TDFType[TDFType["List"] = 4] = "List";
    TDFType[TDFType["Dictionary"] = 5] = "Dictionary";
    TDFType[TDFType["Union"] = 6] = "Union";
    TDFType[TDFType["IntegerList"] = 7] = "IntegerList";
    TDFType[TDFType["IntVector2"] = 8] = "IntVector2";
    TDFType[TDFType["IntVector3"] = 9] = "IntVector3";
    TDFType[TDFType["Unknown"] = -1] = "Unknown";
})(TDFType || (exports.TDFType = TDFType = {}));
class UnknownTDFType extends Error {
    constructor(tdftype) {
        super(tdftype);
        this.message = `Unknown TDF type ${tdftype}`;
    }
}
class TDFNotImplemented extends Error {
    constructor(tdftype) {
        if (typeof tdftype === 'number') {
            tdftype = TDFType[tdftype];
        }
        super(tdftype);
        this.message = `TDF type ${tdftype} is not implemented yet`;
    }
}
class TDF {
    static readTDF(stream) {
        const label = TDF.decodeLabel(stream.read(3));
        const type = stream.read(1).readUInt8(0);
        switch (type) {
            case TDFType.Integer:
                return TDFInteger.read(label, stream);
            case TDFType.String:
                return TDFString.read(label, stream);
            case TDFType.Blob:
                return TDFBlob.read(label, stream);
            case TDFType.Struct:
                return TDFStruct.read(label, stream);
            case TDFType.List:
                return TDFList.read(label, stream);
            case TDFType.Dictionary:
                return TDFDictionary.read(label, stream);
            case TDFType.Union:
                return TDFUnion.read(label, stream);
            case TDFType.IntegerList:
                return TDFIntegerList.read(label, stream);
            case TDFType.IntVector2:
                return TDFIntVector2.read(label, stream);
            case TDFType.IntVector3:
                return TDFIntVector3.read(label, stream);
            default:
                throw new UnknownTDFType(type.toString());
        }
    }
    formPrefix() {
        return Buffer.concat([
            TDF.encodeLabel(this.label),
            Buffer.from([this.type]),
        ]);
    }
    static decodeLabel(tag) {
        let encodedTag = tag.readUIntBE(0, 3);
        const decodedTag = Buffer.alloc(4);
        for (let i = 3; i >= 0; --i) {
            const sixbits = encodedTag & 0x3f;
            if (sixbits) {
                decodedTag[i] = sixbits + 32;
            }
            else {
                decodedTag[i] = 0x20;
            }
            encodedTag >>= 6;
        }
        return decodedTag.toString();
    }
    static encodeLabel(tag) {
        if (tag.length !== 4) {
            throw new Error('Tag must be 4 characters long.');
        }
        tag = tag.toUpperCase();
        let encodedTag = 0;
        for (let i = 0; i < tag.length; i++) {
            const char = tag[i];
            if (char === ' ') {
                continue;
            }
            encodedTag |= (char.charCodeAt(0) - 32) << (6 * (3 - i));
        }
        return Buffer.from([
            (encodedTag >> 16) & 0xff,
            (encodedTag >> 8) & 0xff,
            encodedTag & 0xff,
        ]);
    }
}
exports.TDF = TDF;
class TDFInteger extends TDF {
    constructor(label, value) {
        super();
        this.label = label;
        this.type = TDFType.Integer;
        this.value = value;
    }
    static decode(stream) {
        let result = 0n;
        let byte = stream.read(1);
        result += BigInt(byte[0]) & 0x3fn;
        let currentShift = 6;
        while ((byte[0] & 0x80) != 0) {
            byte = stream.read(1);
            result |= (BigInt(byte[0]) & 0x7fn) << BigInt(currentShift);
            currentShift += 7;
        }
        return Number(result);
    }
    static encode(value) {
        const result = [];
        const long = BigInt(value);
        if (long < 0x40) {
            result.push(long & 0xffn);
        }
        else {
            let currentByte = (long & 0x3fn) | 0x80n;
            result.push(currentByte);
            let currentShift = long >> 6n;
            while (currentShift >= 0x80) {
                currentByte = (currentShift & 0x7fn) | 0x80n;
                currentShift >>= 7n;
                result.push(currentByte);
            }
            result.push(currentShift);
        }
        return Buffer.from(result.map((x) => Number(x)));
    }
    static read(label, stream) {
        return new TDFInteger(label, TDFInteger.decode(stream));
    }
    write() {
        return Buffer.concat([this.formPrefix(), TDFInteger.encode(this.value)]);
    }
}
exports.TDFInteger = TDFInteger;
class TDFString extends TDF {
    constructor(label, value) {
        super();
        this.label = label;
        this.type = TDFType.String;
        this.value = value;
    }
    static decode(stream) {
        const length = TDFInteger.decode(stream);
        const result = stream.read(length - 1);
        stream.read(1);
        if (length == 1) {
            return '';
        }
        return result.toString('utf8');
    }
    static encode(value) {
        return Buffer.concat([
            TDFInteger.encode(value.length + 1),
            Buffer.from(value, 'utf8'),
            Buffer.from([0]),
        ]);
    }
    static read(label, stream) {
        return new TDFString(label, TDFString.decode(stream));
    }
    write() {
        return Buffer.concat([this.formPrefix(), TDFString.encode(this.value)]);
    }
}
exports.TDFString = TDFString;
class TDFBlob extends TDF {
    constructor(label, value) {
        super();
        this.label = label;
        this.type = TDFType.Blob;
        this.value = value;
    }
    static decode(stream) {
        const length = TDFInteger.decode(stream);
        // prevents a null Buffer
        const result = Buffer.alloc(length);
        for (let i = 0; i < length; i++) {
            result[i] = stream.read(1);
        }
        return result;
    }
    static encode(value) {
        return Buffer.concat([TDFInteger.encode(value.length), value]);
    }
    static read(label, stream) {
        return new TDFBlob(label, TDFBlob.decode(stream));
    }
    write() {
        return Buffer.concat([this.formPrefix(), TDFBlob.encode(this.value)]);
    }
}
exports.TDFBlob = TDFBlob;
class TDFStruct extends TDF {
    constructor(label, value) {
        super();
        this.label = label;
        this.type = TDFType.Struct;
        this.value = value;
    }
    static decode(stream) {
        const result = [];
        let byte = stream.read(1);
        while (byte && byte[0] != 0) {
            stream.unshift(byte);
            result.push(TDF.readTDF(stream));
            byte = stream.read(1);
        }
        return result;
    }
    static read(label, stream) {
        return new TDFStruct(label, TDFStruct.decode(stream));
    }
    write() {
        return Buffer.concat([
            this.formPrefix(),
            ...this.value.map((tdf) => tdf.write()),
            Buffer.from([0]),
        ]);
    }
}
exports.TDFStruct = TDFStruct;
class TDFList extends TDF {
    constructor(label, subtype, length, value) {
        super();
        this.label = label;
        this.type = TDFType.List;
        this.subtype = subtype;
        this.length = length;
        this.value = value;
    }
    static decode(stream, subtype, length) {
        const result = [];
        for (let i = 0; i < length; i++) {
            switch (subtype) {
                case TDFType.Integer:
                    result.push(TDFInteger.decode(stream));
                    break;
                case TDFType.String:
                    result.push(TDFString.decode(stream));
                    break;
                case TDFType.Struct:
                    result.push(TDFStruct.decode(stream));
                    break;
                case TDFType.IntVector3:
                    result.push(TDFIntVector3.decode(stream));
                    break;
                default:
                    throw new TDFNotImplemented(subtype);
            }
        }
        return result;
    }
    static read(label, stream) {
        const subtype = TDFInteger.decode(stream);
        const length = TDFInteger.decode(stream);
        return new TDFList(label, subtype, length, TDFList.decode(stream, subtype, length));
    }
    write() {
        return Buffer.concat([
            this.formPrefix(),
            Buffer.from([this.subtype]),
            TDFInteger.encode(this.length),
            ...this.value.map((value) => {
                switch (this.subtype) {
                    case TDFType.Integer:
                        return TDFInteger.encode(value);
                    case TDFType.String:
                        return TDFString.encode(value);
                    case TDFType.Struct:
                        return Buffer.concat(value.map((tdf) => tdf.write()));
                    case TDFType.IntVector3:
                        return TDFIntVector3.encode(value);
                    default:
                        throw new TDFNotImplemented(this.subtype);
                }
            }),
        ]);
    }
}
exports.TDFList = TDFList;
class TDFDictionary extends TDF {
    constructor(label, dictionaryKeyType, dictionaryValueType, length, value) {
        super();
        this.label = label;
        this.type = TDFType.Dictionary;
        this.dictionaryKeyType = dictionaryKeyType;
        this.dictionaryValueType = dictionaryValueType;
        this.length = length;
        this.value = value;
    }
    static decode(stream, dictionaryKeyType, dictionaryValueType, length) {
        const result = {};
        for (let i = 0; i < length; i++) {
            let dictionaryKey, dictionaryValue;
            switch (dictionaryKeyType) {
                case TDFType.Integer:
                    dictionaryKey = TDFInteger.decode(stream);
                    break;
                case TDFType.String:
                    dictionaryKey = TDFString.decode(stream);
                    break;
                default:
                    throw new TDFNotImplemented(dictionaryKeyType);
            }
            switch (dictionaryValueType) {
                case TDFType.Integer:
                    dictionaryValue = TDFInteger.decode(stream);
                    break;
                case TDFType.String:
                    dictionaryValue = TDFString.decode(stream);
                    break;
                case TDFType.Struct:
                    dictionaryValue = TDFStruct.decode(stream);
                    break;
                default:
                    throw new TDFNotImplemented(dictionaryValueType);
            }
            result[dictionaryKey] = dictionaryValue;
        }
        return result;
    }
    static read(label, stream) {
        const dictionaryKeyType = TDFInteger.decode(stream);
        const dictionaryValueType = TDFInteger.decode(stream);
        const length = TDFInteger.decode(stream);
        return new TDFDictionary(label, dictionaryKeyType, dictionaryValueType, length, TDFDictionary.decode(stream, dictionaryKeyType, dictionaryValueType, length));
    }
    write() {
        return Buffer.concat([
            this.formPrefix(),
            Buffer.from([this.dictionaryKeyType, this.dictionaryValueType]),
            TDFInteger.encode(this.length),
            ...Object.entries(this.value).map(([key, value]) => {
                let keyBuffer;
                switch (this.dictionaryKeyType) {
                    case TDFType.Integer:
                        keyBuffer = TDFInteger.encode(key);
                        break;
                    case TDFType.String:
                        keyBuffer = TDFString.encode(key);
                        break;
                    default:
                        throw new TDFNotImplemented(this.dictionaryKeyType);
                }
                let valueBuffer;
                switch (this.dictionaryValueType) {
                    case TDFType.Integer:
                        valueBuffer = TDFInteger.encode(value);
                        break;
                    case TDFType.String:
                        valueBuffer = TDFString.encode(value);
                        break;
                    case TDFType.Struct:
                        valueBuffer = Buffer.concat([
                            ...value.map((tdf) => tdf.write()),
                            Buffer.from([0]),
                        ]);
                        break;
                    default:
                        throw new TDFNotImplemented(this.dictionaryValueType);
                }
                return Buffer.concat([keyBuffer, valueBuffer]);
            }),
        ]);
    }
}
exports.TDFDictionary = TDFDictionary;
class TDFUnion extends TDF {
    constructor(label, unionType, value) {
        super();
        this.label = label;
        this.type = TDFType.Union;
        this.unionType = unionType;
        this.value = value;
    }
    static decode(stream) {
        return TDF.readTDF(stream);
    }
    static read(label, stream) {
        const unionType = stream.read(1);
        const value = TDFUnion.decode(stream);
        return new TDFUnion(label, unionType, value);
    }
    write() {
        return Buffer.concat([
            this.formPrefix(),
            Buffer.from([this.unionType]),
            this.value.write(),
        ]);
    }
}
exports.TDFUnion = TDFUnion;
class TDFIntegerList extends TDF {
    constructor(label, value) {
        super();
        this.label = label;
        this.type = TDFType.IntegerList;
        this.value = value;
    }
    static decode(stream) {
        const length = TDFInteger.decode(stream);
        const result = [];
        for (let i = 0; i < length; i++) {
            result.push(TDFInteger.decode(stream));
        }
        return result;
    }
    static read(label, stream) {
        return new TDFIntegerList(label, TDFIntegerList.decode(stream));
    }
    write() {
        return Buffer.concat([
            this.formPrefix(),
            TDFInteger.encode(this.value.length),
            ...this.value.map((value) => TDFInteger.encode(value)),
        ]);
    }
}
exports.TDFIntegerList = TDFIntegerList;
class TDFIntVector2 extends TDF {
    constructor(label, value) {
        super();
        this.value = [];
        this.label = label;
        this.type = TDFType.IntVector2;
        this.value = value;
    }
    static decode(stream) {
        const result = [];
        for (let i = 0; i < 2; i++) {
            result.push(TDFInteger.decode(stream));
        }
        return result;
    }
    static encode(value) {
        return Buffer.concat([
            TDFInteger.encode(value[0]),
            TDFInteger.encode(value[1]),
        ]);
    }
    static read(label, stream) {
        return new TDFIntVector2(label, TDFIntVector2.decode(stream));
    }
    write() {
        return Buffer.concat([this.formPrefix(), TDFIntVector2.encode(this.value)]);
    }
}
exports.TDFIntVector2 = TDFIntVector2;
class TDFIntVector3 extends TDF {
    constructor(label, value) {
        super();
        this.value = [];
        this.label = label;
        this.type = TDFType.IntVector3;
        this.value = value;
    }
    static decode(stream) {
        const result = [];
        for (let i = 0; i < 3; i++) {
            result.push(TDFInteger.decode(stream));
        }
        return result;
    }
    static encode(value) {
        return Buffer.concat([
            TDFInteger.encode(value[0]),
            TDFInteger.encode(value[1]),
            TDFInteger.encode(value[2]),
        ]);
    }
    static read(label, stream) {
        return new TDFIntVector3(label, TDFIntVector3.decode(stream));
    }
    write() {
        return Buffer.concat([this.formPrefix(), TDFIntVector3.encode(this.value)]);
    }
}
exports.TDFIntVector3 = TDFIntVector3;
