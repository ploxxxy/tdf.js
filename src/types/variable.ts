import Tdf, { BaseType } from './tdf'

class TdfVariable extends Tdf {
  declare value: number[]

  constructor(tag: bigint | string, value: number[]) {
    super(tag, BaseType.Variable, value)
  }
}

export default TdfVariable
