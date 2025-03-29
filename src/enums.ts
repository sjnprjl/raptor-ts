export enum BinaryArrayTypeEnum {
  Single = 0,
  Jagged,
  Rectangular,
  SingleOffset,
  JaggedOffset,
  RectangularOffset,
}

export enum BinaryHeaderEnum {
  SerializedStreamHeader = 0,
  Object = 1,
  ObjectWithMap = 2,
  ObjectWithMapAssemId = 3,
  ObjectWithMapTyped = 4,
  ObjectWithMapTypedAssemId = 5,
  ObjectString = 6,
  Array = 7,
  MemberPrimitiveTyped = 8,
  MemberReference = 9,
  ObjectNull = 10,
  MessageEnd = 11,
  Assembly = 12,
  ObjectNullMultiple256 = 13,
  ObjectNullMultiple = 14,
  ArraySinglePrimitive = 15,
  ArraySingleObject = 16,
  ArraySingleString = 17,
  CrossAppDomainMap = 18,
  CrossAppDomainString = 19,
  CrossAppDomainAssembly = 20,
  MethodCall = 21,
  MethodReturn = 22,
}

/*BinaryTypeEnum*/
export enum BinaryTypeEnum {
  Primitive = 0,
  String = 1,
  Object = 2,
  ObjectUrt = 3,
  ObjectUser = 4,
  ObjectArray = 5,
  StringArray = 6,
  PrimitiveArray = 7,
}

/*InternalPrimitiveTypeE*/
export const enum InternalPrimitiveTypeE {
  Invalid = 0,
  Boolean = 1,
  Byte = 2,
  Char = 3,
  Currency = 4,
  Decimal = 5,
  Double = 6,
  Int16 = 7,
  Int32 = 8,
  Int64 = 9,
  SByte = 10,
  Single = 11,
  TimeSpan = 12,
  DateTime = 13,
  UInt16 = 14,
  UInt32 = 15,
  UInt64 = 16,
  // Used in only for MethodCall or MethodReturn header
  Null = 17,
  String = 18,
}

export enum InternalObjectTypeE {
  Empty = 0,
  Object = 1,
  Array = 2,
}
