"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TDFIntVector3 = exports.TDFIntVector2 = exports.TDFIntegerList = exports.TDFUnion = exports.TDFDictionary = exports.TDFList = exports.TDFStruct = exports.TDFBlob = exports.TDFString = exports.TDFInteger = exports.TDFType = exports.TDF = void 0;
var helper_1 = require("./helper");
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
var UnknownTDFType = /** @class */ (function (_super) {
    __extends(UnknownTDFType, _super);
    function UnknownTDFType(tdftype) {
        var _this = _super.call(this, tdftype) || this;
        _this.message = "Unknown TDF type ".concat(tdftype);
        return _this;
    }
    return UnknownTDFType;
}(Error));
var TDFNotImplemented = /** @class */ (function (_super) {
    __extends(TDFNotImplemented, _super);
    function TDFNotImplemented(tdftype) {
        var _this = this;
        if (typeof tdftype === 'number') {
            tdftype = TDFType[tdftype];
        }
        _this = _super.call(this, tdftype) || this;
        _this.message = "TDF type ".concat(tdftype, " is not implemented yet");
        return _this;
    }
    return TDFNotImplemented;
}(Error));
var TDF = /** @class */ (function () {
    function TDF() {
    }
    TDF.readTDF = function (stream) {
        var label = (0, helper_1.decodeLabel)(stream.read(3));
        var type = stream.read(1).readUInt8(0);
        switch (type) {
            case TDFType.Integer:
                return new TDFInteger(label, TDFInteger.decode(stream));
            case TDFType.String:
                return new TDFString(label, TDFString.decode(stream));
            case TDFType.Blob:
                return new TDFBlob(label, TDFBlob.decode(stream));
            case TDFType.Struct:
                return new TDFStruct(label, TDFStruct.decode(stream));
            case TDFType.List:
                return new TDFList(label, TDFList.decode(stream));
            case TDFType.Dictionary:
                return new TDFDictionary(label, TDFDictionary.decode(stream));
            case TDFType.Union:
                return new TDFUnion(label, TDFUnion.decode(stream));
            case TDFType.IntegerList:
                throw new TDFNotImplemented(TDFType.IntegerList);
            // return new TDFIntegerList(label, TDFIntegerList.decode(stream))
            case TDFType.IntVector2:
                return new TDFIntVector2(label, TDFIntVector2.decode(stream));
            case TDFType.IntVector3:
                return new TDFIntVector3(label, TDFIntVector3.decode(stream));
            default:
                throw new UnknownTDFType(type.toString());
        }
    };
    return TDF;
}());
exports.TDF = TDF;
var TDFInteger = /** @class */ (function (_super) {
    __extends(TDFInteger, _super);
    function TDFInteger(label, value) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.Integer;
        _this.value = value;
        return _this;
    }
    TDFInteger.decode = function (stream) {
        var result = 0;
        var byte = stream.read(1);
        result += byte[0] & 0x3f;
        var currentShift = 6;
        while (true) {
            if ((byte[0] & 0x80) == 0) {
                break;
            }
            byte = stream.read(1);
            result |= (byte[0] & 0x7f) << currentShift;
            currentShift += 7;
        }
        return result;
    };
    return TDFInteger;
}(TDF));
exports.TDFInteger = TDFInteger;
var TDFString = /** @class */ (function (_super) {
    __extends(TDFString, _super);
    function TDFString(label, value) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.String;
        _this.value = value;
        return _this;
    }
    TDFString.decode = function (stream) {
        var _a;
        var length = TDFInteger.decode(stream);
        var string = stream.read(length - 1);
        stream.read(1);
        return (_a = string === null || string === void 0 ? void 0 : string.toString('utf8')) !== null && _a !== void 0 ? _a : '<couldn\'t read>'; // TODO: reimplement
    };
    TDFString.encode = function (stream, string) {
        var length = (string.length + 1).toString(16);
        stream.push(Buffer.from(length.padStart(2, '0'), 'hex'));
        stream.push(Buffer.from(string, 'utf8'));
        stream.push(Buffer.from('00', 'hex'));
    };
    return TDFString;
}(TDF));
exports.TDFString = TDFString;
var TDFBlob = /** @class */ (function (_super) {
    __extends(TDFBlob, _super);
    function TDFBlob(label, value) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.Blob;
        _this.value = value;
        return _this;
    }
    TDFBlob.decode = function (stream) {
        var length = TDFInteger.decode(stream);
        // is this correct?
        if (length > 10) {
            length = 1;
        }
        var value = Buffer.alloc(length);
        for (var i = 0; i < length; i++) {
            value[i] = stream.read(1);
        }
        return value;
    };
    return TDFBlob;
}(TDF));
exports.TDFBlob = TDFBlob;
var TDFStruct = /** @class */ (function (_super) {
    __extends(TDFStruct, _super);
    function TDFStruct(label, value) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.Struct;
        _this.value = value;
        return _this;
    }
    TDFStruct.decode = function (stream) {
        var list = [];
        var b;
        while (true) {
            b = stream.read(1);
            if (b == null || b[0] == 0) {
                break;
            }
            if (b[0] == 2) {
                // idk?
                continue;
            }
            stream.unshift(b);
            list.push(TDF.readTDF(stream));
        }
        return list;
    };
    return TDFStruct;
}(TDF));
exports.TDFStruct = TDFStruct;
var TDFList = /** @class */ (function (_super) {
    __extends(TDFList, _super);
    function TDFList(label, value) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.List;
        _this.value = value;
        return _this;
    }
    TDFList.decode = function (stream) {
        var value = [];
        var subtype = TDFInteger.decode(stream);
        var count = TDFInteger.decode(stream);
        for (var i = 0; i < count; i++) {
            switch (subtype) {
                case TDFType.Integer:
                    value.push(TDFInteger.decode(stream));
                    break;
                case TDFType.String:
                    value.push(TDFString.decode(stream));
                    break;
                case TDFType.Blob:
                    value.push(TDFBlob.decode(stream));
                    break;
                case TDFType.Struct:
                    value.push(TDFStruct.decode(stream));
                    break;
                default:
                    throw new TDFNotImplemented(subtype);
            }
        }
        return value;
    };
    return TDFList;
}(TDF));
exports.TDFList = TDFList;
var TDFDictionary = /** @class */ (function (_super) {
    __extends(TDFDictionary, _super);
    function TDFDictionary(label, value) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.Dictionary;
        _this.value = value;
        return _this;
    }
    TDFDictionary.decode = function (stream) {
        var value = {};
        var dictionaryKeyType = TDFInteger.decode(stream);
        var dictionaryValueType = TDFInteger.decode(stream);
        var count = TDFInteger.decode(stream);
        for (var i = 0; i < count; i++) {
            var dictionaryKey = void 0, dictionaryValue = void 0;
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
                case TDFType.Blob:
                    dictionaryValue = TDFBlob.decode(stream);
                    break;
                case TDFType.Struct:
                    dictionaryValue = TDFStruct.decode(stream);
                    break;
                default:
                    throw new TDFNotImplemented(dictionaryValueType);
            }
            value[dictionaryKey] = dictionaryValue;
        }
        return value;
    };
    return TDFDictionary;
}(TDF));
exports.TDFDictionary = TDFDictionary;
var TDFUnion = /** @class */ (function (_super) {
    __extends(TDFUnion, _super);
    function TDFUnion(label, value) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.Union;
        _this.value = value;
        return _this;
    }
    TDFUnion.decode = function (stream) {
        var unionType = stream.read(1).readUInt8(0);
        return TDF.readTDF(stream);
    };
    return TDFUnion;
}(TDF));
exports.TDFUnion = TDFUnion;
var TDFIntegerList = /** @class */ (function (_super) {
    __extends(TDFIntegerList, _super);
    function TDFIntegerList(label, value) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.IntegerList;
        _this.value = value;
        return _this;
    }
    TDFIntegerList.decode = function (stream) { };
    return TDFIntegerList;
}(TDF));
exports.TDFIntegerList = TDFIntegerList;
var TDFIntVector2 = /** @class */ (function (_super) {
    __extends(TDFIntVector2, _super);
    function TDFIntVector2(label, value) {
        var _this = _super.call(this) || this;
        _this.value = [];
        _this.label = label;
        _this.type = TDFType.IntVector2;
        _this.value = value;
        return _this;
    }
    TDFIntVector2.decode = function (stream) {
        var value = [];
        for (var i = 0; i < 2; i++) {
            value.push(TDFInteger.decode(stream));
        }
        return value;
    };
    return TDFIntVector2;
}(TDF));
exports.TDFIntVector2 = TDFIntVector2;
var TDFIntVector3 = /** @class */ (function (_super) {
    __extends(TDFIntVector3, _super);
    function TDFIntVector3(label, value) {
        var _this = _super.call(this) || this;
        _this.value = [];
        _this.label = label;
        _this.type = TDFType.IntVector3;
        _this.value = value;
        return _this;
    }
    TDFIntVector3.decode = function (stream) {
        var value = [];
        for (var i = 0; i < 3; i++) {
            value.push(TDFInteger.decode(stream));
        }
        return value;
    };
    return TDFIntVector3;
}(TDF));
exports.TDFIntVector3 = TDFIntVector3;
