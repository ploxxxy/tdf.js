import { BaseType } from '../utils/basetype'
import Tdf from './tdf'

class TdfInteger extends Tdf {
  declare value: bigint

  constructor(tag: bigint | string, value: bigint | number) {
    super(tag, BaseType.Integer, BigInt(value))
  }
}

export default TdfInteger
