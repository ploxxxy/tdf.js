import { BaseType } from '../utils/basetype'
import Tdf from './tdf'

class TdfStruct extends Tdf {
  declare value: Tdf[]

  constructor(tag: bigint | string, value: Tdf[]) {
    super(tag, BaseType.Struct, value)
  }
}

export default TdfStruct
