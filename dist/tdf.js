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
                return new TDFInteger(label, stream);
            case TDFType.String:
                return new TDFString(label, stream);
            case TDFType.Blob:
                return new TDFBlob(label, stream);
            case TDFType.Struct:
                return new TDFStruct(label, stream);
            case TDFType.List:
                return new TDFList(label, stream);
            case TDFType.Dictionary:
                return new TDFDictionary(label, stream);
            case TDFType.Union:
                return new TDFUnion(label, stream);
            case TDFType.IntegerList:
                return new TDFIntegerList(label, stream);
            case TDFType.IntVector2:
                return new TDFIntVector2(label, stream);
            case TDFType.IntVector3:
                return new TDFIntVector3(label, stream);
            default:
                throw new UnknownTDFType(type.toString());
        }
    };
    return TDF;
}());
exports.TDF = TDF;
var TDFInteger = /** @class */ (function (_super) {
    __extends(TDFInteger, _super);
    function TDFInteger(label, stream) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.Integer;
        _this.value = TDFInteger.readInteger(stream);
        return _this;
    }
    TDFInteger.readInteger = function (stream) {
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
    function TDFString(label, stream) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.String;
        _this.value = TDFString.readString(stream);
        return _this;
    }
    TDFString.readString = function (stream) {
        var _a;
        var length = TDFInteger.readInteger(stream);
        var string = stream.read(length - 1);
        stream.read(1);
        return (_a = string === null || string === void 0 ? void 0 : string.toString('utf8')) !== null && _a !== void 0 ? _a : "<couldn't read>"; // TODO: reimplement
    };
    TDFString.writeString = function (stream, string) {
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
    function TDFBlob(label, stream) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.Blob;
        var length = TDFInteger.readInteger(stream);
        if (length > 10) {
            length = 1;
        }
        var value = Buffer.alloc(length);
        for (var i = 0; i < length; i++) {
            value[i] = stream.read(1);
        }
        _this.value = value;
        return _this;
    }
    return TDFBlob;
}(TDF));
exports.TDFBlob = TDFBlob;
var TDFStruct = /** @class */ (function (_super) {
    __extends(TDFStruct, _super);
    function TDFStruct(label, stream) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.Struct;
        _this.value = TDFStruct.readStruct(stream);
        return _this;
    }
    TDFStruct.readStruct = function (stream) {
        var list = [];
        var b;
        while (true) {
            b = stream.read(1);
            if (b == null || b[0] == 0) {
                break;
            }
            if (b[0] == 2) {
                // idk?
            }
            else {
                stream.unshift(b);
                list.push(TDF.readTDF(stream));
            }
        }
        return list;
    };
    return TDFStruct;
}(TDF));
exports.TDFStruct = TDFStruct;
var TDFList = /** @class */ (function (_super) {
    __extends(TDFList, _super);
    function TDFList(label, stream) {
        var _this = _super.call(this) || this;
        _this.value = [];
        _this.label = label;
        _this.type = TDFType.List;
        var subtype = TDFInteger.readInteger(stream);
        var count = TDFInteger.readInteger(stream);
        for (var i = 0; i < count; i++) {
            switch (subtype) {
                case TDFType.Integer:
                    _this.value.push(TDFInteger.readInteger(stream));
                    break;
                case TDFType.String:
                    _this.value.push(TDFString.readString(stream));
                    break;
                case TDFType.Blob:
                    _this.value.push('Blob');
                    break;
                case TDFType.Struct:
                    _this.value.push(TDFStruct.readStruct(stream));
                    break;
                // case TDFType.IntVector3:
                //   this.value.push(new TDFIntVector3('', stream))
                //   stream.read(1)
                //   break
                default:
                    _this.value.push('Nothing');
            }
        }
        return _this;
    }
    return TDFList;
}(TDF));
exports.TDFList = TDFList;
var TDFDictionary = /** @class */ (function (_super) {
    __extends(TDFDictionary, _super);
    function TDFDictionary(label, stream) {
        var _this = _super.call(this) || this;
        _this.value = {};
        _this.label = label;
        _this.type = TDFType.Dictionary;
        var subtype1 = TDFInteger.readInteger(stream);
        var subtype2 = TDFInteger.readInteger(stream);
        var count = TDFInteger.readInteger(stream);
        for (var i = 0; i < count; i++) {
            var key = void 0, value = void 0;
            switch (subtype1) {
                case TDFType.Integer:
                    key = TDFInteger.readInteger(stream);
                    break;
                case TDFType.String:
                    key = TDFString.readString(stream);
                    break;
                default:
                    throw new TDFNotImplemented(subtype1);
            }
            switch (subtype2) {
                case TDFType.Integer:
                    value = TDFInteger.readInteger(stream);
                    break;
                case TDFType.String:
                    value = TDFString.readString(stream);
                    break;
                case TDFType.Blob:
                    value = 'Blob';
                    break;
                case TDFType.Struct:
                    value = TDFStruct.readStruct(stream);
                    break;
                default:
                    throw new TDFNotImplemented(subtype2);
            }
            _this.value[key] = value;
        }
        return _this;
    }
    return TDFDictionary;
}(TDF));
exports.TDFDictionary = TDFDictionary;
var TDFUnion = /** @class */ (function (_super) {
    __extends(TDFUnion, _super);
    function TDFUnion(label, stream) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.Union;
        var unionType = stream.read(1).readUInt8(0);
        _this.value = TDF.readTDF(stream);
        return _this;
    }
    return TDFUnion;
}(TDF));
exports.TDFUnion = TDFUnion;
var TDFIntegerList = /** @class */ (function (_super) {
    __extends(TDFIntegerList, _super);
    function TDFIntegerList(label, stream) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.type = TDFType.IntegerList;
        _this.value = [];
        throw new TDFNotImplemented(_this.type);
        return _this;
    }
    return TDFIntegerList;
}(TDF));
exports.TDFIntegerList = TDFIntegerList;
var TDFIntVector2 = /** @class */ (function (_super) {
    __extends(TDFIntVector2, _super);
    function TDFIntVector2(label, stream) {
        var _this = _super.call(this) || this;
        _this.value = [];
        _this.label = label;
        _this.type = TDFType.IntVector2;
        for (var i = 0; i < 2; i++) {
            _this.value.push(TDFInteger.readInteger(stream));
        }
        return _this;
    }
    return TDFIntVector2;
}(TDF));
exports.TDFIntVector2 = TDFIntVector2;
var TDFIntVector3 = /** @class */ (function (_super) {
    __extends(TDFIntVector3, _super);
    function TDFIntVector3(label, stream) {
        var _this = _super.call(this) || this;
        _this.value = [];
        _this.label = label;
        _this.type = TDFType.IntVector3;
        for (var i = 0; i < 3; i++) {
            _this.value.push(TDFInteger.readInteger(stream));
        }
        return _this;
    }
    return TDFIntVector3;
}(TDF));
exports.TDFIntVector3 = TDFIntVector3;
