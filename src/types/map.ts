import { BaseType, type TdfValue } from '../utils/basetype'
import Tdf from './tdf'

class TdfMap<K extends BaseType, V extends BaseType> extends Tdf {
  declare value: Map<TdfValue<K>, TdfValue<V>>
  keyType: K
  valueType: V

  constructor(
    tag: bigint | string,
    keyType: K,
    valueType: V,
    value: Map<TdfValue<K>, TdfValue<V>>
  ) {
    super(tag, BaseType.Map, value)

    this.keyType = keyType
    this.valueType = valueType
  }
}

export default TdfMap
