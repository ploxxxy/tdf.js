enum BaseType {
  Integer = 0,
  String = 1,
  Binary = 2,
  Struct = 3,
  List = 4,
  Map = 5,
  Union = 6,
  Variable = 7,
  BlazeObjectType = 8,
  BlazeObjectId = 9,
  Max = 10,
}

abstract class Tdf {
  tag: bigint
  type: BaseType
  value: any

  constructor(tag: bigint | string, type: BaseType, value: any) {
    this.tag = typeof tag === 'string' ? this.encodeTag(tag) : tag

    this.type = type
    this.value = value
  }

  get label() {
    return this.decodeTag(this.tag)
  }

  // TODO: move to utils.ts or something
  private decodeTag(tag: bigint) {
    const buf: number[] = new Array(4)

    tag >>= 8n
    for (let i = 3; i >= 0; --i) {
      const sixBits = tag & 0x3fn
      if (sixBits !== 0n) {
        buf[i] = Number(sixBits + 32n)
      } else {
        buf[i] = 0x20
      }
      tag >>= 6n
    }

    let result = ''
    for (let i = 0; i <= buf.length; i++) {
      result += String.fromCharCode(buf[i])
    }

    return result
  }

  private encodeTag(tag: string) {
    tag = tag.toUpperCase().padEnd(4, ' ')

    let result = 0n
    for (let i = 0; i < tag.length; i++) {
      result <<= 6n
      result |= BigInt(tag.charCodeAt(i) - 32)
    }
    return result << 8n
  }
}

export default Tdf
export { BaseType }
