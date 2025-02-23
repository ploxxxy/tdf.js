import {
  TdfBinary,
  TdfBlazeObjectId,
  TdfBlazeObjectType,
  TdfInteger,
  TdfList,
  TdfMap,
  TdfString,
  TdfStruct,
  TdfUnion,
  TdfVariable,
} from '../types'
import type Tdf from '../types/tdf'
import { BaseType } from '../types/tdf'
import BufReader from './reader'

function promoteUnsignedByte(byte: number) {
  return byte & 0xff
}

export default class TdfDecoder {
  private reader: BufReader
  private payload: Tdf[]

  decode(buf: Buffer) {
    // TODO: reuse the reader
    this.reader = new BufReader(buf)
    this.payload = []

    while (this.reader.remaining > 0) {
      this.payload.push(this.readTdf())
    }

    return this.payload
  }

  private readTdf(): Tdf {
    const { tag, type } = this.readHeader()

    switch (type) {
      case BaseType.Integer:
        return new TdfInteger(tag, this.decodeVarsizeInteger())
      case BaseType.String:
        return new TdfString(tag, this.decodeString())
      case BaseType.Binary:
        return new TdfBinary(tag, this.decodeBinary())
      case BaseType.Struct:
        return new TdfStruct(tag, this.decodeStruct())
      case BaseType.List: {
        const { listType, values } = this.decodeList()

        return new TdfList(tag, listType, values)
      }
      case BaseType.Map: {
        const { keyType, valueType, map } = this.decodeMap()

        return new TdfMap(tag, keyType, valueType, map)
      }
      case BaseType.Union:
        return new TdfUnion(tag, this.decodeUnion())
      case BaseType.Variable:
        return new TdfVariable(tag, this.decodeVariable())
      case BaseType.BlazeObjectType:
        return new TdfBlazeObjectType(tag, this.decodeBlazeObjectType())
      case BaseType.BlazeObjectId:
        return new TdfBlazeObjectId(tag, this.decodeBlazeObjectId())
      default:
        throw new Error(`Unsupported type: ${type}`)
    }
  }

  private readTdfValue(type: BaseType) {
    switch (type) {
      case BaseType.Integer:
        return this.decodeVarsizeInteger()
      case BaseType.String:
        return this.decodeString()
      case BaseType.Binary:
        return this.decodeBinary()
      case BaseType.Struct:
        return this.decodeStruct()
      case BaseType.List:
        return this.decodeList()
      case BaseType.Map:
        return this.decodeMap()
      case BaseType.Union:
        return this.decodeUnion()
      case BaseType.Variable:
        return this.decodeVariable()
      case BaseType.BlazeObjectType:
        return this.decodeBlazeObjectType()
      case BaseType.BlazeObjectId:
        return this.decodeBlazeObjectId
      default:
        throw new Error(`Unsupported type: ${type}`)
    }
  }

  private readHeader() {
    const header = this.reader.readBytes(Heat2Util.HEADER_SIZE)

    const tag = BigInt(
      (promoteUnsignedByte(header[0]) << 24) |
        (promoteUnsignedByte(header[1]) << 16) |
        (promoteUnsignedByte(header[2]) << 8)
    )
    const type = promoteUnsignedByte(header[3])

    if (type >= BaseType.Max) {
      throw new Error(`Unsupported type: ${type}`)
    }

    return { tag, type: type as BaseType }
  }

  private decodeVarsizeInteger() {
    let byte = this.reader.readUInt8()

    const valueIsNegative =
      (byte & Heat2Util.VARSIZE_NEGATIVE) === Heat2Util.VARSIZE_NEGATIVE
    let hasMore = (byte & Heat2Util.VARSIZE_MORE) === Heat2Util.VARSIZE_MORE

    let value = BigInt(byte & (Heat2Util.VARSIZE_NEGATIVE - 1))

    if (hasMore) {
      let shift = 6

      while (this.reader.remaining > 0) {
        byte = this.reader.readUInt8()

        let partial = BigInt(byte)
        partial = partial & BigInt(Heat2Util.VARSIZE_MORE - 1)
        partial = partial << BigInt(shift)
        value = value | partial

        hasMore = (byte & Heat2Util.VARSIZE_MORE) !== 0

        if (!hasMore) {
          break
        }

        shift += 7
      }

      if (hasMore) {
        throw new Error('Invalid varsize integer')
      }
    }

    if (valueIsNegative) {
      if (value !== 0n) {
        value = -value
      }
    }

    return value
  }

  private decodeInteger() {
    const value = this.decodeVarsizeInteger()

    // TODO: check if i need to throw an error
    if (value > 0x7fffffffffffffffn || value < -0x8000000000000000n) {
      throw new Error('Integer out of range')
    }

    return Number(value)
  }

  // TODO: implement checks from the original code
  private decodeString() {
    const length = this.decodeInteger()

    if (length < 0) {
      throw new Error('Invalid string length')
    }

    if (this.reader.remaining < length) {
      throw new Error('Not enough data to read string')
    }

    const value = this.reader.readBytes(length - 1)
    this.reader.readUInt8()

    return value.toString('utf-8')
  }

  private decodeBinary() {
    const length = this.decodeInteger()

    if (length < 0) {
      throw new Error('Invalid binary length')
    }

    if (this.reader.remaining < length) {
      throw new Error('Not enough data to read binary')
    }

    return this.reader.readBytes(length)
  }

  private decodeStruct() {
    const tdfs: Tdf[] = []

    while (this.reader.remaining > 0) {
      this.reader.mark()
      const byte = this.reader.readUInt8()
      if (byte === 0) {
        break
      }

      this.reader.reset()

      tdfs.push(this.readTdf())
    }

    return tdfs
  }

  private decodeList() {
    // TODO: enforce type
    const listType = this.reader.readUInt8()
    const length = this.decodeInteger()

    const values: any[] = []
    for (let i = 0; i < length; i++) {
      values.push(this.readTdfValue(listType))
    }

    return { listType, values }
  }

  private decodeMap() {
    const keyType = this.reader.readUInt8()
    const valueType = this.reader.readUInt8()
    const length = this.decodeInteger()

    const map = new Map<string, string | number | Tdf[]>()

    for (let i = 0; i < length; i++) {
      // TODO: might have to be a TDF
      const key = this.readTdfValue(keyType) as string
      const value = this.readTdfValue(valueType) as string | number | Tdf[]

      map.set(key, value)
    }

    return { keyType, valueType, map }
  }

  private decodeUnion() {
    const activeMember = this.reader.readUInt8()

    // TODO: Union.INVALID_MEMBER_INDEX
    if (activeMember === 127) {
      // TODO: handle this case
      throw new Error('Invalid member index')
    }

    return this.readTdf()
  }

  // TODO: check if the logic is correct
  private decodeVariable() {
    const length = this.decodeInteger()
    const values: number[] = []

    for (let i = 0; i < length; i++) {
      values.push(this.decodeInteger())
    }

    // variable tdfs are terminated like a strucutre
    this.reader.readUInt8()

    return values
  }

  private decodeBlazeObjectType() {
    const componentId = this.decodeInteger()
    const typeId = this.decodeInteger()

    return { componentId, typeId }
  }

  private decodeBlazeObjectId() {
    const componentId = this.decodeInteger()
    const typeId = this.decodeInteger()
    const entityId = this.decodeInteger()

    return { componentId, typeId, entityId }
  }
}

// TODO: move
export enum Heat2Util {
  VARSIZE_NEGATIVE = 0x40,
  VARSIZE_MORE = 0x80,
  HEADER_SIZE = 4,
  FLOAT_SIZE = 4,
}
