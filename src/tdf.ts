import { Readable } from 'stream'

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
    const label = TDF.decodeLabel(stream.read(3))
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
    return Buffer.concat([
      TDF.encodeLabel(this.label),
      Buffer.from([this.type]),
    ])
  }

  abstract write(): Buffer

  static decodeLabel(tag: Buffer) {
    let encodedTag = tag.readUIntBE(0, 3)
    const decodedTag = Buffer.alloc(4)

    for (let i = 3; i >= 0; --i) {
      const sixbits = encodedTag & 0x3f
      if (sixbits) {
        decodedTag[i] = sixbits + 32
      } else {
        decodedTag[i] = 0x20
      }
      encodedTag >>= 6
    }

    return decodedTag.toString()
  }

  static encodeLabel(tag: string) {
    if (tag.length !== 4) {
      throw new Error('Tag must be 4 characters long.')
    }

    tag = tag.toUpperCase()

    let encodedTag = 0
    for (let i = 0; i < tag.length; i++) {
      const char = tag[i]
      if (char === ' ') {
        continue
      }
      encodedTag |= (char.charCodeAt(0) - 32) << (6 * (3 - i))
    }

    return Buffer.from([
      (encodedTag >> 16) & 0xff,
      (encodedTag >> 8) & 0xff,
      encodedTag & 0xff,
    ])
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

  write() {
    return Buffer.concat([this.formPrefix(), TDFInteger.encode(this.value)])
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

  write() {
    return Buffer.concat([this.formPrefix(), TDFString.encode(this.value)])
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

  write() {
    return Buffer.concat([this.formPrefix(), TDFBlob.encode(this.value)])
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

  write() {
    return Buffer.concat([
      this.formPrefix(),
      ...this.value.map((tdf) => tdf.write()),
      Buffer.from([0]),
    ])
  }
}

type TDFListValue = number | string | Buffer | TDF[] | number[]
class TDFList extends TDF {
  value: TDFListValue[] // TODO: implement all data types
  subtype: number
  length: number

  constructor(
    label: string,
    subtype: TDFType,
    length: number,
    value: TDFListValue[],
  ) {
    super()

    this.label = label
    this.type = TDFType.List
    this.subtype = subtype
    this.length = length
    this.value = value
  }

  static decode(stream: Readable, subtype: TDFType, length: number) {
    const result: TDFListValue[] = []

    for (let i = 0; i < length; i++) {
      switch (subtype) {
        case TDFType.Integer:
          result.push(TDFInteger.decode(stream))
          break
        case TDFType.String:
          result.push(TDFString.decode(stream))
          break
        case TDFType.Struct:
          result.push(TDFStruct.decode(stream))
          break
        case TDFType.IntVector3:
          result.push(TDFIntVector3.decode(stream))
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

  write() {
    return Buffer.concat([
      this.formPrefix(),
      Buffer.from([this.subtype]),
      TDFInteger.encode(this.length),
      ...this.value.map((value) => {
        switch (this.subtype) {
          case TDFType.Integer:
            return TDFInteger.encode(value as number)
          case TDFType.String:
            return TDFString.encode(value as string)
          case TDFType.Struct:
            return Buffer.concat((value as TDF[]).map((tdf) => tdf.write()))
          case TDFType.IntVector3:
            return TDFIntVector3.encode(value as number[])
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

  write() {
    return Buffer.concat([
      this.formPrefix(),
      Buffer.from([this.dictionaryKeyType, this.dictionaryValueType]),
      TDFInteger.encode(this.length),
      ...Object.entries(this.value).map(([key, value]) => {
        let keyBuffer: Buffer

        switch (this.dictionaryKeyType) {
          case TDFType.Integer:
            keyBuffer = TDFInteger.encode(key as unknown as number)
            break
          case TDFType.String:
            keyBuffer = TDFString.encode(key as string)
            break
          default:
            throw new TDFNotImplemented(this.dictionaryKeyType)
        }

        let valueBuffer: Buffer

        switch (this.dictionaryValueType) {
          case TDFType.Integer:
            valueBuffer = TDFInteger.encode(value as number)
            break
          case TDFType.String:
            valueBuffer = TDFString.encode(value as string)
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

  write() {
    return Buffer.concat([
      this.formPrefix(),
      Buffer.from([this.unionType]),
      this.value.write(),
    ])
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

  write() {
    return Buffer.concat([
      this.formPrefix(),
      TDFInteger.encode(this.value.length),
      ...this.value.map((value) => TDFInteger.encode(value)),
    ])
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

  write() {
    return Buffer.concat([this.formPrefix(), TDFIntVector2.encode(this.value)])
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
