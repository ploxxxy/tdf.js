import type { BlazeObjectType } from './object-type'
import { BaseType } from '../utils/basetype'
import Tdf from './tdf'

interface BlazeObjectId extends BlazeObjectType {
  entityId: number
}

class TdfBlazeObjectId extends Tdf {
  declare value: BlazeObjectId

  constructor(tag: bigint | string, value: BlazeObjectId) {
    super(tag, BaseType.BlazeObjectId, value)
  }
}

export default TdfBlazeObjectId
export type { BlazeObjectId }
