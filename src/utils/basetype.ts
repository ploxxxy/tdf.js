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
  __MAX
}

function isValid(type: number): boolean {
  return type >= 0 && type < BaseType.__MAX
}

export { BaseType, isValid }
