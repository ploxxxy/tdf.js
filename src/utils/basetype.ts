import type { BlazeObjectId } from '../types/object-id'
import type { BlazeObjectType } from '../types/object-type'
import type Tdf from '../types/tdf'

enum BaseType {
  Integer,
  String,
  Binary,
  Struct,
  List,
  Map,
  Union,
  Variable,
  BlazeObjectType,
  BlazeObjectId,
  __MAX,
}

type TypeMapping = Record<BaseType, unknown> & {
  [BaseType.Integer]: bigint | number
  [BaseType.String]: string
  [BaseType.Binary]: Buffer
  [BaseType.Struct]: Tdf[]
  [BaseType.List]: keyof TypeMapping[]
  [BaseType.Map]: Map<Tdf, Tdf>
  [BaseType.Union]: Tdf
  [BaseType.Variable]: number[]
  [BaseType.BlazeObjectType]: BlazeObjectType
  [BaseType.BlazeObjectId]: BlazeObjectId
}

function isValid(type: number): boolean {
  return type >= 0 && type < BaseType.__MAX
}

type TdfValue<T extends BaseType> = TypeMapping[T]

export { BaseType, isValid }
export type { TdfValue }
