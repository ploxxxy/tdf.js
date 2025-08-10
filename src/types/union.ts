import { BaseType } from '../utils/basetype'
import Tdf from './tdf'

class TdfUnion extends Tdf {
  declare value: Tdf

  constructor(tag: number | string, value: Tdf) {
    super(tag, BaseType.Union, value)
  }
}

export default TdfUnion
