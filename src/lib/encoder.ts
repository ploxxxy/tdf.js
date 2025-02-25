import type {
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
import type { BlazeObjectId } from '../types/object-id'
import type { BlazeObjectType } from '../types/object-type'
import type Tdf from '../types/tdf'
import { BaseType, isValid } from '../utils/basetype'
import { Heat2Util } from '../utils/heat2'
import BufWriter from './writer'

class TdfEncoder {
  private writer: BufWriter

  constructor() {
    this.writer = new BufWriter()
  }

  encode(tdfs: Tdf[]) {
    for (const tdf of tdfs) {
      this.writeTdf(tdf)
    }

    return this.writer.buffer
  }

  private writeTdf(tdf: Tdf) {
    const { tag, type } = tdf

    this.writeHeader(tag, type)
    this.writeTdfValue(type, tdf)
  }

  private writeTdfValue(type: BaseType, tdf: Tdf) {
    switch (type) {
      case BaseType.Integer:
        this.encodeVarsizeInteger((tdf as TdfInteger).value)
        break
      case BaseType.String:
        this.encodeString((tdf as TdfString).value)
        break
      case BaseType.Binary:
        this.encodeBinary((tdf as TdfBinary).value)
        break
      case BaseType.Struct:
        this.encodeStruct((tdf as TdfStruct).value)
        break
      case BaseType.List:
        this.encodeList(
          (tdf as TdfList<any>).listType,
          (tdf as TdfList<any>).value
        )
        break
      case BaseType.Map:
        this.encodeMap(
          (tdf as TdfMap<any, any>).keyType,
          (tdf as TdfMap<any, any>).valueType,
          (tdf as TdfMap<any, any>).value
        )
        break
      case BaseType.Union:
        this.encodeUnion((tdf as TdfUnion).value)
        break
      case BaseType.Variable:
        this.encodeVariable((tdf as TdfVariable).value)
        break
      case BaseType.BlazeObjectType:
        this.encodeBlazeObjectType((tdf as TdfBlazeObjectType).value)
        break
      case BaseType.BlazeObjectId:
        this.encodeBlazeObjectId((tdf as TdfBlazeObjectId).value)
        break
      default:
        throw new Error(`Unsupported type: ${type}`)
    }
  }

  private writeHeader(tag: bigint, type: BaseType) {
    if (!isValid(type)) {
      throw new Error(`Unsupported type: ${type}`)
    }

    const header = Buffer.alloc(Heat2Util.HEADER_SIZE)
    header[0] = Number((tag >> 24n) & 0xffn)
    header[1] = Number((tag >> 16n) & 0xffn)
    header[2] = Number((tag >> 8n) & 0xffn)
    header[3] = type

    this.writer.writeBytes(header)
  }

  private encodeVarsizeInteger(value: bigint) {
    if (value === 0n) {
      this.writer.writeUint8(0)
      return
    }

    const buf = Buffer.alloc(Heat2Util.VARSIZE_MAX_ENCODE_SIZE)
    let oidx = 0

    if (value < 0) {
      value = -value

      buf[oidx++] =
        Number(value) & (Heat2Util.VARSIZE_MORE | Heat2Util.VARSIZE_NEGATIVE)
    } else {
      buf[oidx++] =
        (Number(value) & (Heat2Util.VARSIZE_NEGATIVE - 1)) |
        Heat2Util.VARSIZE_MORE
    }

    value >>= 6n

    while (value > 0) {
      buf[oidx++] = Number(value) | Heat2Util.VARSIZE_MORE
      value >>= 7n
    }

    buf[oidx - 1] &= ~Heat2Util.VARSIZE_MORE

    this.writer.writeBytes(buf.subarray(0, oidx))
  }

  private encodeInteger(value: number) {
    this.encodeVarsizeInteger(BigInt(value))
  }

  private encodeString(value: string) {
    const length = Buffer.byteLength(value)
    this.encodeInteger(length)

    const buf = Buffer.from(value)
    this.writer.writeBytes(buf)
    this.writer.writeUint8(0)
  }

  private encodeBinary(value: Buffer) {
    this.encodeInteger(value.length)
    this.writer.writeBytes(value)
  }

  private encodeStruct(value: Tdf[]) {
    for (const tdf of value) {
      this.writeTdf(tdf)
    }
    this.writer.writeUint8(0)
  }

  private encodeList(listType: BaseType, value: any[]) {
    this.encodeInteger(listType)
    this.encodeInteger(value.length)

    for (const item of value) {
      this.writeTdfValue(listType, {
        value: item,
        type: listType,
        tag: 0n,
        label: '',
      })
    }
  }

  private encodeMap(
    keyType: BaseType,
    valueType: BaseType,
    value: Map<string | number, string | number | Tdf[]>
  ) {
    this.encodeInteger(keyType)
    this.encodeInteger(valueType)
    this.encodeInteger(value.size)

    for (const [key, val] of value) {
      this.writeTdfValue(keyType, {
        value: key,
        type: keyType,
        tag: 0n,
        label: '',
      })

      this.writeTdfValue(valueType, {
        value: val,
        type: valueType,
        tag: 0n,
        label: '',
      })
    }
  }

  private encodeUnion(value: Tdf) {
    this.writeTdf(value)
  }

  private encodeVariable(value: number[]) {
    this.encodeInteger(value.length)

    for (const item of value) {
      this.encodeInteger(item)
    }

    this.writer.writeUint8(0)
  }

  private encodeBlazeObjectType(value: BlazeObjectType) {
    this.encodeInteger(value.componentId)
    this.encodeInteger(value.typeId)
  }

  private encodeBlazeObjectId(value: BlazeObjectId) {
    this.encodeInteger(value.componentId)
    this.encodeInteger(value.typeId)
    this.encodeInteger(value.entityId)
  }
}

export default TdfEncoder
