import Tdf, { BaseType } from './tdf'

class TdfList extends Tdf {
  declare value: any[]
  listType: BaseType

  constructor(tag: bigint | string, listType: BaseType, value: any[]) {
    super(tag, BaseType.List, value)

    this.listType = listType
  }
}

export default TdfList
