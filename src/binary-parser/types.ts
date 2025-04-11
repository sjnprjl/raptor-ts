import { BinaryArray, ObjectString } from "./commonclasses";
import { InternalPrimitiveTypeE } from "./enums";
import {
  ASM_Object,
  OString,
  Oval,
  Oval_Procedure,
  Sub_Chart_Kinds,
  System_Int32,
} from "../raptor/assembly";
import { Environment } from "../raptor/environment";
import { RaptorInterpreter } from "../raptor/interpreter";
import { Tokenizer } from "../raptor/tokenizer";

export interface ICloneable<T> {
  clone(): T;
}

export interface IEvaluatable<T> {
  eval(tokenizer: Tokenizer, env: Environment): T;
}

export class Char extends String implements ICloneable<Char> {
  clone(): Char {
    return new Char(this);
  }
  public readonly _type_name = Char.name;
  public readonly _type_info = InternalPrimitiveTypeE.Char;
}
export class Byte extends Number implements ICloneable<Byte> {
  clone(): Byte {
    return new Byte(this);
  }
  public readonly _type_name = Byte.name;
  public readonly _type_info = InternalPrimitiveTypeE.Byte;
}
export class Double extends Number implements ICloneable<Double> {
  clone(): Double {
    return new Double(this);
  }
  public readonly _type_name = Double.name;
  public readonly _type_info = InternalPrimitiveTypeE.Double;
}
export class Int16 extends Number implements ICloneable<Int16> {
  clone(): Int16 {
    return new Int16(this);
  }
  public readonly _type_name = Int16.name;
  public readonly _type_info = InternalPrimitiveTypeE.Int16;
}
export class Int32 extends Number implements ICloneable<Int32> {
  clone() {
    return new Int32(this);
  }

  public readonly _type_name = Int32.name;
  public readonly _type_info = InternalPrimitiveTypeE.Int32;
}
export class Int64 extends String {
  public readonly _type_name = Int64.name;
  public readonly _type_info = InternalPrimitiveTypeE.Int64;
}
export class SByte extends Number {
  public readonly _type_name = SByte.name;
  public readonly _type_info = InternalPrimitiveTypeE.SByte;
}
export class Single extends Number {
  public readonly _type_name = Single.name;
  public readonly _type_info = InternalPrimitiveTypeE.Single;
}
export class UInt16 extends Number {
  public readonly _type_name = UInt16.name;
  public readonly _type_info = InternalPrimitiveTypeE.UInt16;
}
export class UInt32 extends Number {
  public readonly _type_name = UInt32.name;
  public readonly _type_info = InternalPrimitiveTypeE.UInt32;
}
export class UInt64 extends Number {
  public readonly _type_name = UInt64.name;
  public readonly _type_info = InternalPrimitiveTypeE.UInt64;
}
export class TimeSpan extends String {
  public readonly _type_name = TimeSpan.name;
  public readonly _type_info = InternalPrimitiveTypeE.TimeSpan;
}
export class DateTime {
  public readonly _type_name = DateTime.name;
  public readonly _type_info = InternalPrimitiveTypeE.DateTime;
  public value: string;
  constructor(value: bigint) {
    this.value = value.toString();
  }
}
export class Decimal extends String {
  public readonly _type_name = Decimal.name;
  public readonly _type_info = InternalPrimitiveTypeE.Decimal;
}
export class Null {
  public readonly _type_name = Null.name;
  public readonly _type_info = InternalPrimitiveTypeE.Null;
  constructor(public value: any) {}
}
export class OBoolean extends Boolean implements ICloneable<OBoolean> {
  public readonly _type_name = OBoolean.name;
  public readonly _type_info = InternalPrimitiveTypeE.Boolean;
  clone() {
    return new OBoolean(this.valueOf());
  }
}

export class SubChart {
  private _rootComponent?: ASM_Object<Oval | Oval_Procedure>;
  private _magicArray?: ASM_Object<BinaryArray>;
  constructor(
    public readonly name: ASM_Object<OString>,
    public readonly kind: ASM_Object<Sub_Chart_Kinds>,
    public readonly magic_number?: ASM_Object<System_Int32>
  ) {}

  addRootComponent(component: ASM_Object<Oval | Oval_Procedure>) {
    this._rootComponent = component;
  }
  addMagicArray(arr: ASM_Object<BinaryArray>) {
    this._magicArray = arr;
  }

  get magicArray() {
    return this._magicArray;
  }

  get rootComponent() {
    return this._rootComponent;
  }

  next(_: RaptorInterpreter) {
    return this.rootComponent?.valueOf();
  }

  toString() {
    return `SubChart: ${this.name.valueOf().value}`;
  }
}
