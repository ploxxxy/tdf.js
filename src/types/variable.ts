import { BaseType } from '../utils/basetype'
import Tdf from './tdf'

class TdfVariable extends Tdf {
  declare value: number[]

  constructor(tag: number | string, value: number[]) {
    super(tag, BaseType.Variable, value)
  }
}

export default TdfVariable
