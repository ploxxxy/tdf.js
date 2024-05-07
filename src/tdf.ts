import { Readable } from 'stream'
import utils from './utils'

enum TDFType {
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
  Unknown = -1,
}

class UnknownTDFType extends Error {
  constructor(tdftype: string) {
    super(tdftype)
    this.message = `Unknown TDF type ${tdftype}`
  }
}

class TDFNotImplemented extends Error {
  constructor(tdftype: string | TDFType) {
    if (typeof tdftype === 'number') {
      tdftype = TDFType[tdftype]
    }

    super(tdftype)
    this.message = `TDF type ${tdftype} is not implemented yet`
  }
}

abstract class TDF {
  label: string
  type: TDFType
  value: unknown

  constructor(label: string, type: TDFType) {
    this.label = label
    this.type = type
  }

  static readTDF(stream: Readable): TDF {
    const label = utils.decodeLabel(stream.read(3))
    const type: TDFType = stream.read(1).readUInt8(0)

    switch (type) {
      case TDFType.Integer:
        return TDFInteger.read(label, stream)
      case TDFType.String:
        return TDFString.read(label, stream)
      case TDFType.Blob:
        return TDFBlob.read(label, stream)
      case TDFType.Struct:
        return TDFStruct.read(label, stream)
      case TDFType.List:
        return TDFList.read(label, stream)
      case TDFType.Dictionary:
        return TDFDictionary.read(label, stream)
      case TDFType.Union:
        return TDFUnion.read(label, stream)
      case TDFType.IntegerList:
        return TDFIntegerList.read(label, stream)
      case TDFType.IntVector2:
        return TDFIntVector2.read(label, stream)
      case TDFType.IntVector3:
        return TDFIntVector3.read(label, stream)
      default:
        throw new UnknownTDFType(type.toString())
    }
  }

  formPrefix() {
    return Buffer.concat([utils.encodeLabel(this.label), Buffer.from([this.type])])
  }

  abstract write(): Buffer
}

class TDFInteger extends TDF {
  value: number

  constructor(label: string, value: number) {
    super(label, TDFType.Integer)
    this.value = value
  }

  static read(label: string, stream: Readable) {
    return new TDFInteger(label, utils.decompressInteger(stream))
  }

  write() {
    return Buffer.concat([this.formPrefix(), utils.compressInteger(this.value)])
  }
}

class TDFString extends TDF {
  value: string

  constructor(label: string, value: string) {
    super(label, TDFType.String)
    this.value = value
  }

  static read(label: string, stream: Readable) {
    return new TDFString(label, utils.readString(stream))
  }

  write() {
    return Buffer.concat([this.formPrefix(), utils.writeString(this.value)])
  }
}

class TDFBlob extends TDF {
  value: Buffer

  constructor(label: string, value: Buffer) {
    super(label, TDFType.Blob)
    this.value = value
  }

  static decode(stream: Readable) {
    const length = utils.decompressInteger(stream)

    // prevents a null Buffer
    const result = Buffer.alloc(length)
    for (let i = 0; i < length; i++) {
      result[i] = stream.read(1)
    }

    return result
  }

  static encode(value: Buffer) {
    return Buffer.concat([utils.compressInteger(value.length), value])
  }

  static read(label: string, stream: Readable) {
    return new TDFBlob(label, TDFBlob.decode(stream))
  }

  write() {
    return Buffer.concat([this.formPrefix(), TDFBlob.encode(this.value)])
  }
}

class TDFStruct extends TDF {
  value: TDF[]

  constructor(label: string, value: TDF[]) {
    super(label, TDFType.Struct)
    this.value = value
  }

  static read(label: string, stream: Readable) {
    return new TDFStruct(label, utils.readStruct(stream))
  }

  write() {
    return Buffer.concat([
      this.formPrefix(),
      ...this.value.map((tdf) => tdf.write()),
      Buffer.from([0]),
    ])
  }
}

class TDFList<T> extends TDF {
  value: T[]
  subtype: number
  length: number

  constructor(label: string, subtype: TDFType, length: number, value: T[]) {
    super(label, TDFType.List)
    this.subtype = subtype
    this.length = length
    this.value = value
  }

  static decode<T>(stream: Readable, subtype: TDFType, length: number) {
    const result: T[] = []

    for (let i = 0; i < length; i++) {
      switch (subtype) {
        case TDFType.Integer:
          result.push(utils.decompressInteger(stream) as T)
          break
        case TDFType.String:
          result.push(utils.readString(stream) as T)
          break
        case TDFType.Struct:
          result.push(utils.readStruct(stream) as T)
          break
        case TDFType.IntVector3:
          result.push(TDFIntVector3.decode(stream) as T)
          break
        default:
          throw new TDFNotImplemented(subtype)
      }
    }

    return result
  }

  static read(label: string, stream: Readable) {
    const subtype = utils.decompressInteger(stream)
    const length = utils.decompressInteger(stream)

    return new TDFList(label, subtype, length, TDFList.decode(stream, subtype, length))
  }

  write() {
    return Buffer.concat([
      this.formPrefix(),
      Buffer.from([this.subtype]),
      utils.compressInteger(this.length),
      ...this.value.map((value) => {
        switch (this.subtype) {
          case TDFType.Integer:
            return utils.compressInteger(value as number)
          case TDFType.String:
            return utils.writeString(value as string)
          case TDFType.Struct:
            return Buffer.concat((value as TDF[]).map((tdf) => tdf.write()))
          case TDFType.IntVector3:
            return TDFIntVector3.encode(value as number[])
          case TDFType.List:
            return Buffer.concat((value as TDF[]).map((tdf) => tdf.write()))
          default:
            throw new TDFNotImplemented(this.subtype)
        }
      }),
    ])
  }
}

interface Dictionary {
  [key: string | number]: number | string | TDF[]
}

class TDFDictionary extends TDF {
  value: Dictionary
  dictionaryKeyType: TDFType
  dictionaryValueType: TDFType
  length: number

  constructor(
    label: string,
    dictionaryKeyType: TDFType,
    dictionaryValueType: TDFType,
    length: number,
    value: Dictionary
  ) {
    super(label, TDFType.Dictionary)
    this.dictionaryKeyType = dictionaryKeyType
    this.dictionaryValueType = dictionaryValueType
    this.length = length
    this.value = value
  }

  static decode(
    stream: Readable,
    dictionaryKeyType: TDFType,
    dictionaryValueType: TDFType,
    length: number
  ) {
    const result: Dictionary = {}

    for (let i = 0; i < length; i++) {
      let dictionaryKey: string | number, dictionaryValue: number | string | TDF[]

      switch (dictionaryKeyType) {
        case TDFType.Integer:
          dictionaryKey = utils.decompressInteger(stream)
          break
        case TDFType.String:
          dictionaryKey = utils.readString(stream)
          break
        default:
          throw new TDFNotImplemented(dictionaryKeyType)
      }

      switch (dictionaryValueType) {
        case TDFType.Integer:
          dictionaryValue = utils.decompressInteger(stream)
          break
        case TDFType.String:
          dictionaryValue = utils.readString(stream)
          break
        case TDFType.Struct:
          dictionaryValue = utils.readStruct(stream)
          break
        default:
          throw new TDFNotImplemented(dictionaryValueType)
      }

      result[dictionaryKey] = dictionaryValue
    }

    return result
  }

  static read(label: string, stream: Readable) {
    const dictionaryKeyType: TDFType = utils.decompressInteger(stream)
    const dictionaryValueType: TDFType = utils.decompressInteger(stream)
    const length = utils.decompressInteger(stream)

    return new TDFDictionary(
      label,
      dictionaryKeyType,
      dictionaryValueType,
      length,
      TDFDictionary.decode(stream, dictionaryKeyType, dictionaryValueType, length)
    )
  }

  write() {
    return Buffer.concat([
      this.formPrefix(),
      Buffer.from([this.dictionaryKeyType, this.dictionaryValueType]),
      utils.compressInteger(this.length),
      ...Object.entries(this.value).map(([key, value]) => {
        let keyBuffer: Buffer

        switch (this.dictionaryKeyType) {
          case TDFType.Integer:
            keyBuffer = utils.compressInteger(key as unknown as number)
            break
          case TDFType.String:
            keyBuffer = utils.writeString(key as string)
            break
          default:
            throw new TDFNotImplemented(this.dictionaryKeyType)
        }

        let valueBuffer: Buffer

        switch (this.dictionaryValueType) {
          case TDFType.Integer:
            valueBuffer = utils.compressInteger(value as number)
            break
          case TDFType.String:
            valueBuffer = utils.writeString(value as string)
            break
          case TDFType.Struct:
            valueBuffer = Buffer.concat([
              ...(value as TDF[]).map((tdf) => tdf.write()),
              Buffer.from([0]),
            ])
            break
          default:
            throw new TDFNotImplemented(this.dictionaryValueType)
        }

        return Buffer.concat([keyBuffer, valueBuffer])
      }),
    ])
  }
}

class TDFUnion extends TDF {
  value: TDF
  unionType: number // no idea what this is

  constructor(label: string, unionType: number, value: TDF) {
    super(label, TDFType.Union)
    this.unionType = unionType
    this.value = value
  }

  static decode(stream: Readable) {
    return TDF.readTDF(stream)
  }

  static read(label: string, stream: Readable) {
    const unionType = stream.read(1)[0]
    const value = TDFUnion.decode(stream)

    return new TDFUnion(label, unionType, value)
  }

  write() {
    return Buffer.concat([this.formPrefix(), Buffer.from([this.unionType]), this.value.write()])
  }
}

class TDFIntegerList extends TDF {
  value: number[]

  constructor(label: string, value: number[]) {
    super(label, TDFType.IntegerList)
    this.value = value
  }

  static decode(stream: Readable) {
    const length = utils.decompressInteger(stream)
    const result: number[] = []

    for (let i = 0; i < length; i++) {
      result.push(utils.decompressInteger(stream))
    }

    return result
  }

  static read(label: string, stream: Readable) {
    return new TDFIntegerList(label, TDFIntegerList.decode(stream))
  }

  write() {
    return Buffer.concat([
      this.formPrefix(),
      utils.compressInteger(this.value.length),
      ...this.value.map((value) => utils.compressInteger(value)),
    ])
  }
}

class TDFIntVector2 extends TDF {
  value: number[] = []

  constructor(label: string, value: number[]) {
    super(label, TDFType.IntVector2)
    this.value = value
  }

  static decode(stream: Readable) {
    const result: number[] = []

    for (let i = 0; i < 2; i++) {
      result.push(utils.decompressInteger(stream))
    }

    return result
  }

  static encode(value: number[]) {
    return Buffer.concat([utils.compressInteger(value[0]), utils.compressInteger(value[1])])
  }

  static read(label: string, stream: Readable) {
    return new TDFIntVector2(label, TDFIntVector2.decode(stream))
  }

  write() {
    return Buffer.concat([this.formPrefix(), TDFIntVector2.encode(this.value)])
  }
}

class TDFIntVector3 extends TDF {
  value: number[] = []

  constructor(label: string, value: number[]) {
    super(label, TDFType.IntVector3)
    this.value = value
  }

  static decode(stream: Readable) {
    const result: number[] = []

    for (let i = 0; i < 3; i++) {
      result.push(utils.decompressInteger(stream))
    }

    return result
  }

  static encode(value: number[]) {
    return Buffer.concat([
      utils.compressInteger(value[0]),
      utils.compressInteger(value[1]),
      utils.compressInteger(value[2]),
    ])
  }

  static read(label: string, stream: Readable) {
    return new TDFIntVector3(label, TDFIntVector3.decode(stream))
  }

  write() {
    return Buffer.concat([this.formPrefix(), TDFIntVector3.encode(this.value)])
  }
}

export {
  TDF,
  TDFBlob,
  TDFDictionary,
  TDFIntVector2,
  TDFIntVector3,
  TDFInteger,
  TDFIntegerList,
  TDFList,
  TDFString,
  TDFStruct,
  TDFType,
  TDFUnion,
}
