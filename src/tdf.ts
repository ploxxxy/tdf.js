import { Readable } from 'stream'
import { decodeLabel } from './helper'

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
  label!: string
  type!: TDFType
  value?: any

  static readTDF(stream: Readable): TDF {
    const label = decodeLabel(stream.read(3))
    const type: TDFType = stream.read(1).readUInt8(0)

    switch (type) {
      case TDFType.Integer:
        return new TDFInteger(label, TDFInteger.readInteger(stream))
      case TDFType.String:
        return new TDFString(label, TDFString.readString(stream))
      case TDFType.Blob:
        return new TDFBlob(label, TDFBlob.readBlob(stream))
      case TDFType.Struct:
        return new TDFStruct(label, TDFStruct.readStruct(stream))
      case TDFType.List:
        return new TDFList(label, TDFList.readList(stream))
      case TDFType.Dictionary:
        return new TDFDictionary(label, TDFDictionary.readDictionary(stream))
      case TDFType.Union:
        return new TDFUnion(label, TDFUnion.readUnion(stream))
      case TDFType.IntegerList:
        throw new TDFNotImplemented(TDFType.IntegerList)
        // return new TDFIntegerList(label, TDFIntegerList.readIntegerList(stream))
      case TDFType.IntVector2:
        return new TDFIntVector2(label, TDFIntVector2.readIntVector2(stream))
      case TDFType.IntVector3:
        return new TDFIntVector3(label, TDFIntVector3.readIntVector3(stream))
      default:
        throw new UnknownTDFType(type.toString())
    }
  }

  // abstract write(stream: Readable): void
}

class TDFInteger extends TDF {
  value: number

  static readInteger(stream: Readable) {
    let result = 0

    let byte = stream.read(1)

    result += byte[0] & 0x3f
    let currentShift = 6

    while (true) {
      if ((byte[0] & 0x80) == 0) {
        break
      }

      byte = stream.read(1)

      result |= (byte[0] & 0x7f) << currentShift
      currentShift += 7
    }

    return result
  }

  constructor(label: string, value: number) {
    super()

    this.label = label
    this.type = TDFType.Integer
    this.value = value
  }
}

class TDFString extends TDF {
  value: string

  constructor(label: string, value: string) {
    super()

    this.label = label
    this.type = TDFType.String
    this.value = value
  }

  static readString(stream: Readable) {
    const length = TDFInteger.readInteger(stream)
    const string = stream.read(length - 1)

    stream.read(1)

    return string?.toString('utf8') ?? "<couldn't read>" // TODO: reimplement
  }

  static writeString(stream: Readable, string: string) {
    const length = (string.length + 1).toString(16)

    stream.push(Buffer.from(length.padStart(2, '0'), 'hex'))
    stream.push(Buffer.from(string, 'utf8'))
    stream.push(Buffer.from('00', 'hex'))
  }
}

class TDFBlob extends TDF {
  value: Buffer

  constructor(label: string, value: Buffer) {
    super()

    this.label = label
    this.type = TDFType.Blob
    this.value = value
  }

  static readBlob(stream: Readable) {
    let length = TDFInteger.readInteger(stream)
    // is this correct?
    if (length > 10) {
      length = 1
    }

    let value = Buffer.alloc(length)
    for (let i = 0; i < length; i++) {
      value[i] = stream.read(1)
    }

    return value
  }
}

class TDFStruct extends TDF {
  value: TDF[]

  constructor(label: string, value: TDF[]) {
    super()

    this.label = label
    this.type = TDFType.Struct
    this.value = value
  }

  static readStruct(stream: Readable) {
    let list: TDF[] = []
    let b: Buffer

    while (true) {
      b = stream.read(1)

      if (b == null || b[0] == 0) {
        break
      }

      if (b[0] == 2) {
        // idk?
      } else {
        stream.unshift(b)

        list.push(TDF.readTDF(stream))
      }
    }

    return list
  }
}

class TDFList extends TDF {
  value: any[] // TODO: implement all data types

  constructor(label: string, value: any[]) {
    super()

    this.label = label
    this.type = TDFType.List
    this.value = value
  }

  static readList(stream: Readable) {
    let value: any[] = []
    let subtype = TDFInteger.readInteger(stream)
    let count = TDFInteger.readInteger(stream)

    for (let i = 0; i < count; i++) {
      switch (subtype) {
        case TDFType.Integer:
          value.push(TDFInteger.readInteger(stream))
          break
        case TDFType.String:
          value.push(TDFString.readString(stream))
          break
        case TDFType.Blob:
          value.push('Blob')
          break
        case TDFType.Struct:
          value.push(TDFStruct.readStruct(stream))
          break
        default:
          throw new TDFNotImplemented(subtype)
      }
    }

    return value
  }
}

interface Dictionary<TDF> {
  [key: string | number]: TDF
}

class TDFDictionary extends TDF {
  value: Dictionary<TDF>

  constructor(label: string, value: Dictionary<TDF>) {
    super()

    this.label = label
    this.type = TDFType.Dictionary
    this.value = value
  }

  static readDictionary(stream: Readable) {
    let value: Dictionary<TDF> = {}
    let dictionaryKeyType: TDFType = TDFInteger.readInteger(stream)
    let dictionaryValueType: TDFType = TDFInteger.readInteger(stream)
    let count = TDFInteger.readInteger(stream)

    for (let i = 0; i < count; i++) {
      let dictionaryKey: string | number, dictionaryValue: any

      switch (dictionaryKeyType) {
        case TDFType.Integer:
          dictionaryKey = TDFInteger.readInteger(stream)
          break
        case TDFType.String:
          dictionaryKey = TDFString.readString(stream)
          break
        default:
          throw new TDFNotImplemented(dictionaryKeyType)
      }

      switch (dictionaryValueType) {
        case TDFType.Integer:
          dictionaryValue = TDFInteger.readInteger(stream)
          break
        case TDFType.String:
          dictionaryValue = TDFString.readString(stream)
          break
        case TDFType.Blob:
          dictionaryValue = TDFBlob.readBlob(stream)
          break
        case TDFType.Struct:
          dictionaryValue = TDFStruct.readStruct(stream)
          break
        default:
          throw new TDFNotImplemented(dictionaryValueType)
      }

      value[dictionaryKey] = dictionaryValue
    }

    return value
  }
}

class TDFUnion extends TDF {
  value: TDF

  constructor(label: string, value: TDF) {
    super()

    this.label = label
    this.type = TDFType.Union
    this.value = value
  }

  static readUnion(stream: Readable) {
    const unionType = stream.read(1).readUInt8(0)
    return TDF.readTDF(stream)
  }
}

class TDFIntegerList extends TDF {
  value: TDF[]

  constructor(label: string, value: TDF[]) {
    super()

    this.label = label
    this.type = TDFType.IntegerList
    this.value = value
  }

  static readIntegerList(stream: Readable) {}
}

class TDFIntVector2 extends TDF {
  value: number[] = []

  constructor(label: string, value: number[]) {
    super()

    this.label = label
    this.type = TDFType.IntVector2
    this.value = value
  }

  static readIntVector2(stream: Readable) {
    const value: number[] = []

    for (let i = 0; i < 2; i++) {
      value.push(TDFInteger.readInteger(stream))
    }

    return value
  }
}

class TDFIntVector3 extends TDF {
  value: number[] = []

  constructor(label: string, value: number[]) {
    super()

    this.label = label
    this.type = TDFType.IntVector3
    this.value = value
  }

  static readIntVector3(stream: Readable) {
    const value: number[] = []

    for (let i = 0; i < 3; i++) {
      value.push(TDFInteger.readInteger(stream))
    }

    return value
  }
}

export {
  TDF,
  TDFType,
  TDFInteger,
  TDFString,
  TDFBlob,
  TDFStruct,
  TDFList,
  TDFDictionary,
  TDFUnion,
  TDFIntegerList,
  TDFIntVector2,
  TDFIntVector3,
}
