import { BaseType } from '../utils/basetype'
import Tdf from './tdf'

class TdfBinary extends Tdf {
  declare value: Buffer

  constructor(tag: number | string, value: Buffer) {
    super(tag, BaseType.Binary, value)
  }
}

export default TdfBinary
