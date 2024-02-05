"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeLabel = exports.decodeLabel = void 0;
var decodeLabel = function (tag) {
    var encodedTag = tag.readUIntBE(0, 3);
    var decodedTag = Buffer.alloc(4);
    for (var i = 3; i >= 0; --i) {
        var sixbits = encodedTag & 0x3f;
        if (sixbits) {
            decodedTag[i] = sixbits + 32;
        }
        else {
            decodedTag[i] = 0x20;
        }
        encodedTag >>= 6;
    }
    return decodedTag.toString();
};
exports.decodeLabel = decodeLabel;
var encodeLabel = function (tag) {
    if (tag.length !== 4) {
        throw new Error('Tag must be 4 characters long.');
    }
    tag = tag.toUpperCase();
    var encodedTag = 0;
    for (var i = 0; i < tag.length; i++) {
        var char = tag[i];
        if (char === ' ') {
            continue;
        }
        encodedTag |= (char.charCodeAt(0) - 32) << (6 * (3 - i));
    }
    return Buffer.from([(encodedTag >> 16) & 0xff, (encodedTag >> 8) & 0xff, encodedTag & 0xff]);
};
exports.encodeLabel = encodeLabel;
