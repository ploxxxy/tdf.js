"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tdf_1 = require("./tdf");
const decodeLabel = (tag) => {
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
};
const encodeLabel = (tag) => {
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
    return Buffer.from([(encodedTag >> 16) & 0xff, (encodedTag >> 8) & 0xff, encodedTag & 0xff]);
};
const decompressInteger = (stream) => {
    let result = 0n;
    let byte = stream.read(1);
    result += BigInt(byte[0]) & 0x3fn;
    let currentShift = 6;
    while ((byte[0] & 0x80) != 0) {
        byte = stream.read(1);
        result |= (BigInt(byte[0]) & 0x7fn) << BigInt(currentShift);
        currentShift += 7;
    }
    return Number(result) >>> 0;
};
const compressInteger = (value) => {
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
};
const readString = (stream) => {
    const length = decompressInteger(stream);
    const result = stream.read(length - 1);
    stream.read(1);
    // TODO: check why is this a thing
    if (length == 1) {
        return '';
    }
    return result.toString('utf8');
};
const writeString = (value) => {
    return Buffer.concat([
        compressInteger(value.length + 1),
        Buffer.from(value, 'utf8'),
        Buffer.from([0]),
    ]);
};
const readStruct = (stream) => {
    const result = [];
    let byte = stream.read(1);
    while (byte && byte[0] != 0) {
        stream.unshift(byte);
        result.push(tdf_1.TDF.readTDF(stream));
        byte = stream.read(1);
    }
    return result;
};
exports.default = {
    decodeLabel,
    encodeLabel,
    decompressInteger,
    compressInteger,
    readString,
    writeString,
    readStruct,
};
