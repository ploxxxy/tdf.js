"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TDFUnion = exports.TDFType = exports.TDFStruct = exports.TDFString = exports.TDFList = exports.TDFIntegerList = exports.TDFInteger = exports.TDFIntVector3 = exports.TDFIntVector2 = exports.TDFDictionary = exports.TDFBlob = exports.TDF = void 0;
const utils_1 = __importDefault(require("./utils"));
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
    constructor(label, type) {
        this.label = label;
        this.type = type;
    }
    static readTDF(stream) {
        const label = utils_1.default.decodeLabel(stream.read(3));
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
        return Buffer.concat([utils_1.default.encodeLabel(this.label), Buffer.from([this.type])]);
    }
}
exports.TDF = TDF;
class TDFInteger extends TDF {
    constructor(label, value) {
        super(label, TDFType.Integer);
        this.value = value;
    }
    static read(label, stream) {
        return new TDFInteger(label, utils_1.default.decompressInteger(stream));
    }
    write() {
        return Buffer.concat([this.formPrefix(), utils_1.default.compressInteger(this.value)]);
    }
}
exports.TDFInteger = TDFInteger;
class TDFString extends TDF {
    constructor(label, value) {
        super(label, TDFType.String);
        this.value = value;
    }
    static read(label, stream) {
        return new TDFString(label, utils_1.default.readString(stream));
    }
    write() {
        return Buffer.concat([this.formPrefix(), utils_1.default.writeString(this.value)]);
    }
}
exports.TDFString = TDFString;
class TDFBlob extends TDF {
    constructor(label, value) {
        super(label, TDFType.Blob);
        this.value = value;
    }
    static decode(stream) {
        const length = utils_1.default.decompressInteger(stream);
        // prevents a null Buffer
        const result = Buffer.alloc(length);
        for (let i = 0; i < length; i++) {
            result[i] = stream.read(1);
        }
        return result;
    }
    static encode(value) {
        return Buffer.concat([utils_1.default.compressInteger(value.length), value]);
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
        super(label, TDFType.Struct);
        this.value = value;
    }
    static read(label, stream) {
        return new TDFStruct(label, utils_1.default.readStruct(stream));
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
        super(label, TDFType.List);
        this.subtype = subtype;
        this.length = length;
        this.value = value;
    }
    static decode(stream, subtype, length) {
        const result = [];
        for (let i = 0; i < length; i++) {
            switch (subtype) {
                case TDFType.Integer:
                    result.push(utils_1.default.decompressInteger(stream));
                    break;
                case TDFType.String:
                    result.push(utils_1.default.readString(stream));
                    break;
                case TDFType.Struct:
                    result.push(utils_1.default.readStruct(stream));
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
        const subtype = utils_1.default.decompressInteger(stream);
        const length = utils_1.default.decompressInteger(stream);
        return new TDFList(label, subtype, length, TDFList.decode(stream, subtype, length));
    }
    write() {
        return Buffer.concat([
            this.formPrefix(),
            Buffer.from([this.subtype]),
            utils_1.default.compressInteger(this.length),
            ...this.value.map((value) => {
                switch (this.subtype) {
                    case TDFType.Integer:
                        return utils_1.default.compressInteger(value);
                    case TDFType.String:
                        return utils_1.default.writeString(value);
                    case TDFType.Struct:
                        return Buffer.concat(value.map((tdf) => tdf.write()));
                    case TDFType.IntVector3:
                        return TDFIntVector3.encode(value);
                    case TDFType.List:
                        return Buffer.concat(value.map((tdf) => tdf.write()));
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
        super(label, TDFType.Dictionary);
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
                    dictionaryKey = utils_1.default.decompressInteger(stream);
                    break;
                case TDFType.String:
                    dictionaryKey = utils_1.default.readString(stream);
                    break;
                default:
                    throw new TDFNotImplemented(dictionaryKeyType);
            }
            switch (dictionaryValueType) {
                case TDFType.Integer:
                    dictionaryValue = utils_1.default.decompressInteger(stream);
                    break;
                case TDFType.String:
                    dictionaryValue = utils_1.default.readString(stream);
                    break;
                case TDFType.Struct:
                    dictionaryValue = utils_1.default.readStruct(stream);
                    break;
                default:
                    throw new TDFNotImplemented(dictionaryValueType);
            }
            result[dictionaryKey] = dictionaryValue;
        }
        return result;
    }
    static read(label, stream) {
        const dictionaryKeyType = utils_1.default.decompressInteger(stream);
        const dictionaryValueType = utils_1.default.decompressInteger(stream);
        const length = utils_1.default.decompressInteger(stream);
        return new TDFDictionary(label, dictionaryKeyType, dictionaryValueType, length, TDFDictionary.decode(stream, dictionaryKeyType, dictionaryValueType, length));
    }
    write() {
        return Buffer.concat([
            this.formPrefix(),
            Buffer.from([this.dictionaryKeyType, this.dictionaryValueType]),
            utils_1.default.compressInteger(this.length),
            ...Object.entries(this.value).map(([key, value]) => {
                let keyBuffer;
                switch (this.dictionaryKeyType) {
                    case TDFType.Integer:
                        keyBuffer = utils_1.default.compressInteger(key);
                        break;
                    case TDFType.String:
                        keyBuffer = utils_1.default.writeString(key);
                        break;
                    default:
                        throw new TDFNotImplemented(this.dictionaryKeyType);
                }
                let valueBuffer;
                switch (this.dictionaryValueType) {
                    case TDFType.Integer:
                        valueBuffer = utils_1.default.compressInteger(value);
                        break;
                    case TDFType.String:
                        valueBuffer = utils_1.default.writeString(value);
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
        super(label, TDFType.Union);
        this.unionType = unionType;
        this.value = value;
    }
    static decode(stream) {
        return TDF.readTDF(stream);
    }
    static read(label, stream) {
        const unionType = stream.read(1)[0];
        const value = TDFUnion.decode(stream);
        return new TDFUnion(label, unionType, value);
    }
    write() {
        return Buffer.concat([this.formPrefix(), Buffer.from([this.unionType]), this.value.write()]);
    }
}
exports.TDFUnion = TDFUnion;
class TDFIntegerList extends TDF {
    constructor(label, value) {
        super(label, TDFType.IntegerList);
        this.value = value;
    }
    static decode(stream) {
        const length = utils_1.default.decompressInteger(stream);
        const result = [];
        for (let i = 0; i < length; i++) {
            result.push(utils_1.default.decompressInteger(stream));
        }
        return result;
    }
    static read(label, stream) {
        return new TDFIntegerList(label, TDFIntegerList.decode(stream));
    }
    write() {
        return Buffer.concat([
            this.formPrefix(),
            utils_1.default.compressInteger(this.value.length),
            ...this.value.map((value) => utils_1.default.compressInteger(value)),
        ]);
    }
}
exports.TDFIntegerList = TDFIntegerList;
class TDFIntVector2 extends TDF {
    constructor(label, value) {
        super(label, TDFType.IntVector2);
        this.value = [];
        this.value = value;
    }
    static decode(stream) {
        const result = [];
        for (let i = 0; i < 2; i++) {
            result.push(utils_1.default.decompressInteger(stream));
        }
        return result;
    }
    static encode(value) {
        return Buffer.concat([utils_1.default.compressInteger(value[0]), utils_1.default.compressInteger(value[1])]);
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
        super(label, TDFType.IntVector3);
        this.value = [];
        this.value = value;
    }
    static decode(stream) {
        const result = [];
        for (let i = 0; i < 3; i++) {
            result.push(utils_1.default.decompressInteger(stream));
        }
        return result;
    }
    static encode(value) {
        return Buffer.concat([
            utils_1.default.compressInteger(value[0]),
            utils_1.default.compressInteger(value[1]),
            utils_1.default.compressInteger(value[2]),
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
