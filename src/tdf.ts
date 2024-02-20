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

abstract class TDF {
  label!: string
  type!: TDFType
  value: unknown

  static readTDF(stream: Readable): TDF {
    const label = decodeLabel(stream.read(3))
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

  formPrefix(label: string, type: TDFType) {
    return Buffer.concat([encodeLabel(label), Buffer.from([type])])
  }

  abstract write(stream: Readable): void
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
    let result = 0n
    let byte = stream.read(1)

    result += BigInt(byte[0]) & 0x3fn
    let currentShift = 6

    while ((byte[0] & 0x80) != 0) {
      byte = stream.read(1)
      result |= (BigInt(byte[0]) & 0x7fn) << BigInt(currentShift)
      currentShift += 7
    }

    return Number(result)
  }

  static encode(value: number) {
    const result: bigint[] = []

    const long = BigInt(value)

    if (long < 0x40) {
      result.push(long & 0xffn)
    } else {
      let currentByte = (long & 0x3fn) | 0x80n
      result.push(currentByte)
      let currentShift = long >> 6n
      while (currentShift >= 0x80) {
        currentByte = (currentShift & 0x7fn) | 0x80n
        currentShift >>= 7n
        result.push(currentByte)
      }
      result.push(currentShift)
    }

    return Buffer.from(result.map((x) => Number(x)))
  }

  static read(label: string, stream: Readable) {
    return new TDFInteger(label, TDFInteger.decode(stream))
  }

  write(stream: Readable) {
    const result = TDFInteger.encode(this.value)

    stream.push(this.formPrefix(this.label, this.type))
    stream.push(result)
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
    const result = stream.read(length - 1)

    stream.read(1)

    if (length == 1) {
      return ''
    }

    return result.toString('utf8')
  }

  static encode(value: string) {
    return Buffer.concat([
      TDFInteger.encode(value.length + 1),
      Buffer.from(value, 'utf8'),
      Buffer.from([0]),
    ])
  }

  static read(label: string, stream: Readable) {
    return new TDFString(label, TDFString.decode(stream))
  }

  write(stream: Readable) {
    stream.push(this.formPrefix(this.label, this.type))
    stream.push(TDFString.encode(this.value))
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
    const length = TDFInteger.decode(stream)

    // prevents a null Buffer
    const result = Buffer.alloc(length)
    for (let i = 0; i < length; i++) {
      result[i] = stream.read(1)
    }

    return result
  }

  static encode(value: Buffer) {
    return Buffer.concat([TDFInteger.encode(value.length), value])
  }

  static read(label: string, stream: Readable) {
    return new TDFBlob(label, TDFBlob.decode(stream))
  }

  write(stream: Readable) {
    stream.push(this.formPrefix(this.label, this.type))
    stream.push(TDFBlob.encode(this.value))
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
    const result: TDF[] = []
    let byte: Buffer = stream.read(1)

    while (byte && byte[0] != 0) {
      stream.unshift(byte)
      result.push(TDF.readTDF(stream))
      byte = stream.read(1)
    }

    return result
  }

  static read(label: string, stream: Readable) {
    return new TDFStruct(label, TDFStruct.decode(stream))
  }

  write(stream: Readable) {
    stream.push(this.formPrefix(this.label, this.type))
    this.value.forEach((tdf) => tdf.write(stream))
    stream.push(Buffer.from([0]))
  }
}

class TDFList extends TDF {
  value: unknown[] // TODO: implement all data types
  subtype: number
  length: number

  constructor(
    label: string,
    subtype: TDFType,
    length: number,
    value: unknown[],
  ) {
    super()

    this.label = label
    this.type = TDFType.List
    this.subtype = subtype
    this.length = length
    this.value = value
  }

  static decode(stream: Readable, subtype: TDFType, length: number) {
    const result: unknown[] = []

    for (let i = 0; i < length; i++) {
      switch (subtype) {
      case TDFType.Integer:
        result.push(TDFInteger.decode(stream))
        break
      case TDFType.String:
        result.push(TDFString.decode(stream))
        break
      case TDFType.Blob:
        result.push(TDFBlob.decode(stream))
        break
      case TDFType.Struct:
        result.push(TDFStruct.decode(stream))
        break
      default:
        throw new TDFNotImplemented(subtype)
      }
    }

    return result
  }

  static read(label: string, stream: Readable) {
    const subtype = TDFInteger.decode(stream)
    const length = TDFInteger.decode(stream)

    return new TDFList(
      label,
      subtype,
      length,
      TDFList.decode(stream, subtype, length),
    )
  }

  write(stream: Readable) {
    stream.push(this.formPrefix(this.label, this.type))
    stream.push(Buffer.from([this.subtype]))
    stream.push(TDFInteger.encode(this.length))

    this.value.forEach((value) => {
      switch (this.subtype) {
      case TDFType.Integer:
        stream.push(TDFInteger.encode(value as number))
        break
      case TDFType.String:
        stream.push(TDFString.encode(value as string))
        break
      case TDFType.Blob:
        stream.push(TDFBlob.encode(value as Buffer))
        break
      case TDFType.Struct:
        throw new TDFNotImplemented(this.subtype)
        break
      default:
        throw new TDFNotImplemented(this.subtype)
      }
    })
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
    value: Dictionary,
  ) {
    super()

    this.label = label
    this.type = TDFType.Dictionary
    this.dictionaryKeyType = dictionaryKeyType
    this.dictionaryValueType = dictionaryValueType
    this.length = length
    this.value = value
  }

  static decode(
    stream: Readable,
    dictionaryKeyType: TDFType,
    dictionaryValueType: TDFType,
    length: number,
  ) {
    const result: Dictionary = {}

    for (let i = 0; i < length; i++) {
      let dictionaryKey: string | number,
        dictionaryValue: number | string | TDF[]

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
      case TDFType.Struct:
        dictionaryValue = TDFStruct.decode(stream)
        break
      default:
        throw new TDFNotImplemented(dictionaryValueType)
      }

      result[dictionaryKey] = dictionaryValue
    }

    return result
  }

  static read(label: string, stream: Readable) {
    const dictionaryKeyType: TDFType = TDFInteger.decode(stream)
    const dictionaryValueType: TDFType = TDFInteger.decode(stream)
    const length = TDFInteger.decode(stream)

    return new TDFDictionary(
      label,
      dictionaryKeyType,
      dictionaryValueType,
      length,
      TDFDictionary.decode(
        stream,
        dictionaryKeyType,
        dictionaryValueType,
        length,
      ),
    )
  }

  write(stream: Readable) {
    stream.push(this.formPrefix(this.label, this.type))
    stream.push(Buffer.from([this.dictionaryKeyType, this.dictionaryValueType]))
    stream.push(TDFInteger.encode(this.length))

    for (const [key, value] of Object.entries(this.value)) {
      switch (this.dictionaryKeyType) {
      case TDFType.Integer:
        stream.push(TDFInteger.encode(key as unknown as number))
        break
      case TDFType.String:
        stream.push(TDFString.encode(key as string))
        break
      default:
        throw new TDFNotImplemented(this.dictionaryKeyType)
      }

      switch (this.dictionaryValueType) {
      case TDFType.Integer:
        stream.push(TDFInteger.encode(value as number))
        break
      case TDFType.String:
        stream.push(TDFString.encode(value as string))
        break
      case TDFType.Struct:
        (value as TDF[]).forEach((tdf) => tdf.write(stream))
        stream.push(Buffer.from([0]))
        break
      default:
        throw new TDFNotImplemented(this.dictionaryValueType)
      }
    }
  }
}

class TDFUnion extends TDF {
  value: TDF
  unionType: number // no idea what this is

  constructor(label: string, unionType: number, value: TDF) {
    super()

    this.label = label
    this.type = TDFType.Union
    this.unionType = unionType
    this.value = value
  }

  static decode(stream: Readable) {
    return TDF.readTDF(stream)
  }

  static read(label: string, stream: Readable) {
    const unionType = stream.read(1)
    const value = TDFUnion.decode(stream)

    return new TDFUnion(label, unionType, value)
  }

  write(stream: Readable) {
    stream.push(this.formPrefix(this.label, this.type))
    stream.push(this.unionType)
    this.value.write(stream)
  }
}

class TDFIntegerList extends TDF {
  value: number[]

  constructor(label: string, value: number[]) {
    super()

    this.label = label
    this.type = TDFType.IntegerList
    this.value = value
  }

  static decode(stream: Readable) {
    const length = TDFInteger.decode(stream)
    const result: number[] = []

    for (let i = 0; i < length; i++) {
      result.push(TDFInteger.decode(stream))
    }

    return result
  }

  static read(label: string, stream: Readable) {
    return new TDFIntegerList(label, TDFIntegerList.decode(stream))
  }

  write(stream: Readable) {
    stream.push(this.formPrefix(this.label, this.type))
    stream.push(TDFInteger.encode(this.value.length))
    this.value.forEach((value) => {
      stream.push(TDFInteger.encode(value))
    })
  }
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
    const result: number[] = []

    for (let i = 0; i < 2; i++) {
      result.push(TDFInteger.decode(stream))
    }

    return result
  }

  static encode(value: number[]) {
    return Buffer.concat([
      TDFInteger.encode(value[0]),
      TDFInteger.encode(value[1]),
    ])
  }

  static read(label: string, stream: Readable) {
    return new TDFIntVector2(label, TDFIntVector2.decode(stream))
  }

  write(stream: Readable) {
    stream.push(this.formPrefix(this.label, this.type))
    stream.push(TDFIntVector2.encode(this.value))
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
    const result: number[] = []

    for (let i = 0; i < 3; i++) {
      result.push(TDFInteger.decode(stream))
    }

    return result
  }

  static encode(value: number[]) {
    return Buffer.concat([
      TDFInteger.encode(value[0]),
      TDFInteger.encode(value[1]),
      TDFInteger.encode(value[2]),
    ])
  }

  static read(label: string, stream: Readable) {
    return new TDFIntVector3(label, TDFIntVector3.decode(stream))
  }

  write(stream: Readable) {
    stream.push(this.formPrefix(this.label, this.type))
    stream.push(TDFIntVector3.encode(this.value))
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
