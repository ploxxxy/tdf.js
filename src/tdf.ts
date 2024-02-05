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

  static readTDF(stream: Readable) {
    const label = decodeLabel(stream.read(3))
    const type: TDFType = stream.read(1).readUInt8(0)

    switch (type) {
      case TDFType.Integer:
        return new TDFInteger(label, stream)
      case TDFType.String:
        return new TDFString(label, stream)
      case TDFType.Blob:
        return new TDFBlob(label, stream)
      case TDFType.Struct:
        return new TDFStruct(label, stream)
      case TDFType.List:
        return new TDFList(label, stream)
      case TDFType.Dictionary:
        return new TDFDictionary(label, stream)
      case TDFType.Union:
        return new TDFUnion(label, stream)
      case TDFType.IntegerList:
        return new TDFIntegerList(label, stream)
      case TDFType.IntVector2:
        return new TDFIntVector2(label, stream)
      case TDFType.IntVector3:
        return new TDFIntVector3(label, stream)
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

  constructor(label: string, stream: Readable) {
    super()

    this.label = label
    this.type = TDFType.Integer
    this.value = TDFInteger.readInteger(stream)
  }
}

class TDFString extends TDF {
  value: string

  constructor(label: string, stream: Readable) {
    super()

    this.label = label
    this.type = TDFType.String

    this.value = TDFString.readString(stream)
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

  constructor(label: string, stream: Readable) {
    super()

    this.label = label
    this.type = TDFType.Blob

    let length = TDFInteger.readInteger(stream)
    if (length > 10) {
      length = 1
    }
    let value = Buffer.alloc(length)
    for (let i = 0; i < length; i++) {
      value[i] = stream.read(1)
    }

    this.value = value
  }
}

class TDFStruct extends TDF {
  value: TDF[]

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

  constructor(label: string, stream: Readable) {
    super()

    this.label = label
    this.type = TDFType.Struct

    this.value = TDFStruct.readStruct(stream)
  }
}

class TDFList extends TDF {
  value: any[] = []

  constructor(label: string, stream: Readable) {
    super()

    this.label = label
    this.type = TDFType.List
    let subtype = TDFInteger.readInteger(stream)

    let count = TDFInteger.readInteger(stream)

    for (let i = 0; i < count; i++) {
      switch (subtype) {
        case TDFType.Integer:
          this.value.push(TDFInteger.readInteger(stream))
          break
        case TDFType.String:
          this.value.push(TDFString.readString(stream))
          break
        case TDFType.Blob:
          this.value.push('Blob')
          break
        case TDFType.Struct:
          this.value.push(TDFStruct.readStruct(stream))
          break
        // case TDFType.IntVector3:
        //   this.value.push(new TDFIntVector3('', stream))
        //   stream.read(1)
        //   break
        default:
          this.value.push('Nothing')
      }
    }
  }
}

class TDFDictionary extends TDF {
  value: any = {}

  constructor(label: string, stream: Readable) {
    super()

    this.label = label
    this.type = TDFType.Dictionary

    let subtype1: TDFType = TDFInteger.readInteger(stream)
    let subtype2: TDFType = TDFInteger.readInteger(stream)
    let count = TDFInteger.readInteger(stream)

    for (let i = 0; i < count; i++) {
      let key: string | number, value: any

      switch (subtype1) {
        case TDFType.Integer:
          key = TDFInteger.readInteger(stream)
          break
        case TDFType.String:
          key = TDFString.readString(stream)
          break
        default:
          throw new TDFNotImplemented(subtype1)
      }

      switch (subtype2) {
        case TDFType.Integer:
          value = TDFInteger.readInteger(stream)
          break
        case TDFType.String:
          value = TDFString.readString(stream)
          break
        case TDFType.Blob:
          value = 'Blob'
          break
        case TDFType.Struct:
          value = TDFStruct.readStruct(stream)
          break
        default:
          throw new TDFNotImplemented(subtype2)
      }

      this.value[key] = value
    }
  }
}

class TDFUnion extends TDF {
  value: TDF

  constructor(label: string, stream: Readable) {
    super()

    this.label = label
    this.type = TDFType.Union

    let unionType = stream.read(1).readUInt8(0)

    this.value = TDF.readTDF(stream)
  }
}

class TDFIntegerList extends TDF {
  value: TDF[]

  constructor(label: string, stream: Readable) {
    super()

    this.label = label
    this.type = TDFType.IntegerList

    this.value = []

    throw new TDFNotImplemented(this.type)
  }
}

class TDFIntVector2 extends TDF {
  value: number[] = []

  constructor(label: string, stream: Readable) {
    super()

    this.label = label
    this.type = TDFType.IntVector2

    for (let i = 0; i < 2; i++) {
      this.value.push(TDFInteger.readInteger(stream))
    }
  }
}

class TDFIntVector3 extends TDF {
  value: number[] = []

  constructor(label: string, stream: Readable) {
    super()

    this.label = label
    this.type = TDFType.IntVector3

    for (let i = 0; i < 3; i++) {
      this.value.push(TDFInteger.readInteger(stream))
    }
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
