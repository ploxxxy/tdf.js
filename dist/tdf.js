"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TDFUnion = exports.TDFType = exports.TDFStruct = exports.TDFString = exports.TDFList = exports.TDFIntegerList = exports.TDFInteger = exports.TDFIntVector3 = exports.TDFIntVector2 = exports.TDFDictionary = exports.TDFBlob = exports.TDF = void 0;
const helper_1 = require("./helper");
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
        const label = (0, helper_1.decodeLabel)(stream.read(3));
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
    formPrefix(label, type) {
        return Buffer.concat([(0, helper_1.encodeLabel)(label), Buffer.from([type])]);
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
    write(stream) {
        const result = TDFInteger.encode(this.value);
        stream.push(this.formPrefix(this.label, this.type));
        stream.push(result);
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
    write(stream) {
        stream.push(this.formPrefix(this.label, this.type));
        stream.push(TDFString.encode(this.value));
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
    write(stream) {
        stream.push(this.formPrefix(this.label, this.type));
        stream.push(TDFBlob.encode(this.value));
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
    write(stream) {
        stream.push(this.formPrefix(this.label, this.type));
        this.value.forEach((tdf) => tdf.write(stream));
        stream.push(Buffer.from([0]));
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
                case TDFType.Blob:
                    result.push(TDFBlob.decode(stream));
                    break;
                case TDFType.Struct:
                    result.push(TDFStruct.decode(stream));
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
    write(stream) {
        stream.push(this.formPrefix(this.label, this.type));
        stream.push(Buffer.from([this.subtype]));
        stream.push(TDFInteger.encode(this.length));
        this.value.forEach((value) => {
            switch (this.subtype) {
                case TDFType.Integer:
                    stream.push(TDFInteger.encode(value));
                    break;
                case TDFType.String:
                    stream.push(TDFString.encode(value));
                    break;
                case TDFType.Blob:
                    stream.push(TDFBlob.encode(value));
                    break;
                case TDFType.Struct:
                    throw new TDFNotImplemented(this.subtype);
                    break;
                default:
                    throw new TDFNotImplemented(this.subtype);
            }
        });
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
    write(stream) {
        stream.push(this.formPrefix(this.label, this.type));
        stream.push(Buffer.from([this.dictionaryKeyType, this.dictionaryValueType]));
        stream.push(TDFInteger.encode(this.length));
        for (const [key, value] of Object.entries(this.value)) {
            switch (this.dictionaryKeyType) {
                case TDFType.Integer:
                    stream.push(TDFInteger.encode(key));
                    break;
                case TDFType.String:
                    stream.push(TDFString.encode(key));
                    break;
                default:
                    throw new TDFNotImplemented(this.dictionaryKeyType);
            }
            switch (this.dictionaryValueType) {
                case TDFType.Integer:
                    stream.push(TDFInteger.encode(value));
                    break;
                case TDFType.String:
                    stream.push(TDFString.encode(value));
                    break;
                case TDFType.Struct:
                    value.forEach((tdf) => tdf.write(stream));
                    stream.push(Buffer.from([0]));
                    break;
                default:
                    throw new TDFNotImplemented(this.dictionaryValueType);
            }
        }
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
    write(stream) {
        stream.push(this.formPrefix(this.label, this.type));
        stream.push(this.unionType);
        this.value.write(stream);
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
    write(stream) {
        stream.push(this.formPrefix(this.label, this.type));
        stream.push(TDFInteger.encode(this.value.length));
        this.value.forEach((value) => {
            stream.push(TDFInteger.encode(value));
        });
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
    write(stream) {
        stream.push(this.formPrefix(this.label, this.type));
        stream.push(TDFIntVector2.encode(this.value));
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
    write(stream) {
        stream.push(this.formPrefix(this.label, this.type));
        stream.push(TDFIntVector3.encode(this.value));
    }
}
exports.TDFIntVector3 = TDFIntVector3;
