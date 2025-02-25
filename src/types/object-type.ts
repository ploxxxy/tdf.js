import { BaseType } from '../utils/basetype'
import Tdf from './tdf'

interface BlazeObjectType {
  componentId: number
  typeId: number
}

class TdfBlazeObjectType extends Tdf {
  declare value: BlazeObjectType

  constructor(tag: bigint | string, value: BlazeObjectType) {
    super(tag, BaseType.BlazeObjectType, value)
  }
}

export default TdfBlazeObjectType
export type { BlazeObjectType }
