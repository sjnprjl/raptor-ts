import { InternalPrimitiveTypeE } from "./enums";

export interface ICloneable<T> {
  clone(): T;
}

export class Char extends String implements ICloneable<Char> {
  clone(): Char {
    return new Char(this);
  }
  private _type_name = Char.name;
  private _type_info = InternalPrimitiveTypeE.Char;
}
export class Byte extends Number implements ICloneable<Byte> {
  clone(): Byte {
    return new Byte(this);
  }
  private _type_name = Byte.name;
  private _type_info = InternalPrimitiveTypeE.Byte;
}
export class Double extends Number implements ICloneable<Double> {
  clone(): Double {
    return new Double(this);
  }
  private _type_name = Double.name;
  private _type_info = InternalPrimitiveTypeE.Double;
}
export class Int16 extends Number implements ICloneable<Int16> {
  clone(): Int16 {
    return new Int16(this);
  }
  private _type_name = Int16.name;
  private _type_info = InternalPrimitiveTypeE.Int16;
}
export class Int32 extends Number implements ICloneable<Int32> {
  clone() {
    return new Int32(this);
  }

  private _type_name = Int32.name;
  private _type_info = InternalPrimitiveTypeE.Int32;
}
export class Int64 extends Number {
  private _type_name = Int64.name;
  private _type_info = InternalPrimitiveTypeE.Int64;
}
export class SByte extends Number {
  private _type_name = SByte.name;
  private _type_info = InternalPrimitiveTypeE.SByte;
}
export class Single extends Number {
  private _type_name = Single.name;
  private _type_info = InternalPrimitiveTypeE.Single;
}
export class UInt16 extends Number {
  private _type_name = UInt16.name;
  private _type_info = InternalPrimitiveTypeE.UInt16;
}
export class UInt32 extends Number {
  private _type_name = UInt32.name;
  private _type_info = InternalPrimitiveTypeE.UInt32;
}
export class UInt64 extends Number {
  private _type_name = UInt64.name;
  private _type_info = InternalPrimitiveTypeE.UInt64;
}
export class TimeSpan extends Number {
  private _type_name = TimeSpan.name;
  private _type_info = InternalPrimitiveTypeE.TimeSpan;
}
export class DateTime {
  private _type_name = DateTime.name;
  private _type_info = InternalPrimitiveTypeE.DateTime;
  public value: string;
  constructor(value: bigint) {
    this.value = value.toString();
  }
}
export class Decimal extends Number {
  private _type_name = Decimal.name;
  private _type_info = InternalPrimitiveTypeE.Decimal;
}
export class Null {
  private _type_name = Null.name;
  private _type_info = InternalPrimitiveTypeE.Null;
  constructor(public value: any) {}
}
export class OBoolean extends Boolean {
  private _type_name = OBoolean.name;
  private _type_info = InternalPrimitiveTypeE.Boolean;
}

export const InternalPrimitiveType: Record<InternalPrimitiveTypeE, any> = {
  [InternalPrimitiveTypeE.Boolean]: OBoolean,
  [InternalPrimitiveTypeE.Byte]: Byte,
  [InternalPrimitiveTypeE.Char]: Char,
  [InternalPrimitiveTypeE.Double]: Double,
  [InternalPrimitiveTypeE.String]: String,
  [InternalPrimitiveTypeE.Invalid]: undefined,
  [InternalPrimitiveTypeE.Currency]: String,
  [InternalPrimitiveTypeE.Decimal]: Decimal,
  [InternalPrimitiveTypeE.Int16]: Int16,
  [InternalPrimitiveTypeE.Int32]: Int32,
  [InternalPrimitiveTypeE.Int64]: Int64,
  [InternalPrimitiveTypeE.SByte]: SByte,
  [InternalPrimitiveTypeE.Single]: Single,
  [InternalPrimitiveTypeE.TimeSpan]: TimeSpan,
  [InternalPrimitiveTypeE.DateTime]: DateTime,
  [InternalPrimitiveTypeE.UInt16]: UInt16,
  [InternalPrimitiveTypeE.UInt32]: UInt32,
  [InternalPrimitiveTypeE.UInt64]: UInt64,
  [InternalPrimitiveTypeE.Null]: Null,
};
