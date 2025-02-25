import type { BaseType } from '../utils/basetype'
import { decodeTag, encodeTag } from '../utils/tag-info'

abstract class Tdf {
  tag: bigint
  type: BaseType
  value: any

  constructor(tag: bigint | string, type: BaseType, value: any) {
    this.tag = typeof tag === 'string' ? encodeTag(tag) : tag

    this.type = type
    this.value = value
  }

  get label() {
    return decodeTag(this.tag)
  }
}

export default Tdf
