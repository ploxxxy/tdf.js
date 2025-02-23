import Tdf, { BaseType } from './tdf'

type SupportedValues = string | number | Tdf[]

class TdfMap extends Tdf {
  declare value: Map<string, SupportedValues>
  keyType: BaseType
  valueType: BaseType

  constructor(
    tag: bigint | string,
    keyType: BaseType,
    valueType: BaseType,
    value: Map<string, SupportedValues>
  ) {
    super(tag, BaseType.Map, value)

    this.keyType = keyType
    this.valueType = valueType
  }
}

export default TdfMap
