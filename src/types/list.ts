import { BaseType, type TdfValue } from '../utils/basetype'
import Tdf from './tdf'

class TdfList<T extends BaseType> extends Tdf {
  declare value: TdfValue<T>[]
  listType: T

  constructor(tag: bigint | string, listType: T, value: TdfValue<T>[]) {
    super(tag, BaseType.List, value)

    this.listType = listType
  }
}

export default TdfList
