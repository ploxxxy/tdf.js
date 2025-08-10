import { BaseType } from '../utils/basetype'
import Tdf from './tdf'

class TdfString extends Tdf {
  declare value: string

  constructor(tag: number | string, value: string) {
    super(tag, BaseType.String, value)
  }
}

export default TdfString
