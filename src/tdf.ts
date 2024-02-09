import { Readable } from 'stream'
import { decodeLabel, encodeLabel } from './helper'

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

class TDF {
  label!: string
  type!: TDFType
  value?: unknown

  static readTDF(stream: Readable): TDF {
    const label = decodeLabel(stream.read(3))
    const type: TDFType = stream.read(1).readUInt8(0)

    switch (type) {
    case TDFType.Integer:
      return new TDFInteger(label, TDFInteger.decode(stream))
    case TDFType.String:
      return new TDFString(label, TDFString.decode(stream))
    case TDFType.Blob:
      return new TDFBlob(label, TDFBlob.decode(stream))
    case TDFType.Struct:
      return new TDFStruct(label, TDFStruct.decode(stream))
    case TDFType.List:
      return new TDFList(label, TDFList.decode(stream))
    case TDFType.Dictionary:
      return new TDFDictionary(label, TDFDictionary.decode(stream))
    case TDFType.Union:
      return new TDFUnion(label, TDFUnion.decode(stream))
    case TDFType.IntegerList:
      throw new TDFNotImplemented(TDFType.IntegerList)
      // return new TDFIntegerList(label, TDFIntegerList.decode(stream))
    case TDFType.IntVector2:
      return new TDFIntVector2(label, TDFIntVector2.decode(stream))
    case TDFType.IntVector3:
      return new TDFIntVector3(label, TDFIntVector3.decode(stream))
    default:
      throw new UnknownTDFType(type.toString())
    }
  }
}

class TDFInteger extends TDF {
  value: number

  constructor(label: string, value: number) {
    super()

    this.label = label
    this.type = TDFType.Integer
    this.value = value
  }

  static decode(stream: Readable) {
    let result = 0

    let byte = stream.read(1)

    result += byte[0] & 0x3f
    let currentShift = 6

    // eslint-disable-next-line no-constant-condition
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
}

class TDFString extends TDF {
  value: string

  constructor(label: string, value: string) {
    super()

    this.label = label
    this.type = TDFType.String
    this.value = value
  }

  static decode(stream: Readable) {
    const length = TDFInteger.decode(stream)
    const string = stream.read(length - 1)

    stream.read(1)

    return string?.toString('utf8') ?? '<couldn\'t read>' // TODO: reimplement
  }

  encode(stream: Readable) {
    const length = (this.value.length + 1).toString(16)

    stream.push(encodeLabel(this.label))
    stream.push(Buffer.from([this.type]))
    stream.push(Buffer.from(length.padStart(2, '0'), 'hex'))
    stream.push(Buffer.from(this.value, 'utf8'))
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

  static decode(stream: Readable) {
    let length = TDFInteger.decode(stream)
    // is this correct?
    if (length > 10) {
      length = 1
    }

    const value = Buffer.alloc(length)
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

  static decode(stream: Readable) {
    const list: TDF[] = []
    let b: Buffer

    // eslint-disable-next-line no-constant-condition
    while (true) {
      b = stream.read(1)

      if (b == null || b[0] == 0) {
        break
      }

      if (b[0] == 2) {
        // idk?
        continue
      }

      stream.unshift(b)
      list.push(TDF.readTDF(stream))
    }

    return list
  }
}

class TDFList extends TDF {
  value: unknown[] // TODO: implement all data types

  constructor(label: string, value: unknown[]) {
    super()

    this.label = label
    this.type = TDFType.List
    this.value = value
  }

  static decode(stream: Readable) {
    const value: unknown[] = []
    const subtype = TDFInteger.decode(stream)
    const count = TDFInteger.decode(stream)

    for (let i = 0; i < count; i++) {
      switch (subtype) {
      case TDFType.Integer:
        value.push(TDFInteger.decode(stream))
        break
      case TDFType.String:
        value.push(TDFString.decode(stream))
        break
      case TDFType.Blob:
        value.push(TDFBlob.decode(stream))
        break
      case TDFType.Struct:
        value.push(TDFStruct.decode(stream))
        break
      default:
        throw new TDFNotImplemented(subtype)
      }
    }

    return value
  }
}

interface Dictionary {
  [key: string | number]: unknown
}

class TDFDictionary extends TDF {
  value: Dictionary

  constructor(label: string, value: Dictionary) {
    super()

    this.label = label
    this.type = TDFType.Dictionary
    this.value = value
  }

  static decode(stream: Readable) {
    const value: Dictionary = {}
    const dictionaryKeyType: TDFType = TDFInteger.decode(stream)
    const dictionaryValueType: TDFType = TDFInteger.decode(stream)
    const count = TDFInteger.decode(stream)

    for (let i = 0; i < count; i++) {
      let dictionaryKey: string | number, dictionaryValue: unknown

      switch (dictionaryKeyType) {
      case TDFType.Integer:
        dictionaryKey = TDFInteger.decode(stream)
        break
      case TDFType.String:
        dictionaryKey = TDFString.decode(stream)
        break
      default:
        throw new TDFNotImplemented(dictionaryKeyType)
      }

      switch (dictionaryValueType) {
      case TDFType.Integer:
        dictionaryValue = TDFInteger.decode(stream)
        break
      case TDFType.String:
        dictionaryValue = TDFString.decode(stream)
        break
      case TDFType.Blob:
        dictionaryValue = TDFBlob.decode(stream)
        break
      case TDFType.Struct:
        dictionaryValue = TDFStruct.decode(stream)
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

  static decode(stream: Readable) {
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

  static decode(stream: Readable) {}
}

class TDFIntVector2 extends TDF {
  value: number[] = []

  constructor(label: string, value: number[]) {
    super()

    this.label = label
    this.type = TDFType.IntVector2
    this.value = value
  }

  static decode(stream: Readable) {
    const value: number[] = []

    for (let i = 0; i < 2; i++) {
      value.push(TDFInteger.decode(stream))
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

  static decode(stream: Readable) {
    const value: number[] = []

    for (let i = 0; i < 3; i++) {
      value.push(TDFInteger.decode(stream))
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
