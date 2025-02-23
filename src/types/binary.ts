import Tdf, { BaseType } from './tdf'

class TdfBinary extends Tdf {
  declare value: Buffer

  constructor(tag: bigint | string, value: Buffer) {
    super(tag, BaseType.Binary, value)
  }
}

export default TdfBinary
