import { BinaryArray, ObjectString } from "./commonclasses";
import { InternalPrimitiveTypeE } from "./enums";
import {
  ASM_Object,
  Component,
  IF_Control,
  OString,
  Oval,
  Oval_Procedure,
  Sub_Chart_Kinds,
  System_Int32,
} from "../raptor/assembly";
import { RaptorInterpreter } from "../raptor/interpreter";
export interface ICloneable<T> {
  clone(): T;
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

  getSymbolTree() {
    let trees: Exclude<typeof symbol, null>[] = [];
    const symbolStack: Exclude<typeof symbol, null>[] = [];
    const treesStack: (typeof trees)[] = [trees];

    let rootComponent: any = this.rootComponent?.valueOf();
    if (!rootComponent)
      throw new Error(
        "There is no root component in a subchart. Not a valid subchart"
      );

    type nameType =
      | "Oval"
      | "Oval_Procedure"
      | "Loop"
      | "IF_Control"
      | "Parallelogram"
      | "Rectangle";
    let symbol: {
      name: nameType;
      component: Component;
      afterCondition?: typeof trees; // for loop
      beforeCondition?: typeof trees; // for loop

      yesChild?: typeof trees; // for if_control
      noChild?: typeof trees; // for if_control
    } | null = null;
    while (rootComponent || symbolStack.length) {
      const name = !rootComponent
        ? null
        : (rootComponent.getName() as nameType);

      if (name) {
        symbol = {
          name,
          component: rootComponent,
        };
      }
      switch (name) {
        case null:
          const popped = symbolStack.pop();
          if (!popped)
            throw new Error("Error: symbol stack is empty. Possibly a bug!");

          switch (popped!.name) {
            case "Loop":
              if (!popped.afterCondition) {
                rootComponent = popped.component;
                symbolStack.push(popped);
              } else {
                // left and right condition are all gathered
                treesStack.pop(); // right
                treesStack.pop(); // left;
                trees = treesStack.pop()!;
                trees.push(popped);
                treesStack.push(trees);
                rootComponent = popped.component.successor;
              }
              break;
            case "IF_Control":
              if (!popped.noChild) {
                rootComponent = popped.component;
                symbolStack.push(popped);
              } else {
                treesStack.pop(); // noChild
                treesStack.pop(); // yesChild
                treesStack[treesStack.length - 1].push(popped);
                rootComponent = popped.component.successor;
              }
              break;
            default:
              throw new Error(
                "Error: symbol stack can only contain block components such as Loop or IF_Control but got: " +
                  popped!.name
              );
          }
          break;

        case "Loop":
          trees = [];
          treesStack.push(trees);
          if (
            symbolStack.length &&
            symbolStack[symbolStack.length - 1].name === "Loop"
          ) {
            symbol = symbolStack[symbolStack.length - 1];
          }

          if (!symbol) throw new Error("symbol is null. Possibly a bug");

          if (symbol.beforeCondition) {
            rootComponent = rootComponent._after_Child.valueOf();
            symbol.afterCondition ??= trees;
          } else {
            symbolStack.push(symbol);
            rootComponent = rootComponent._before_Child.valueOf();
            symbol.beforeCondition ??= trees;
          }

          break;
        case "IF_Control":
          trees = [];
          treesStack.push(trees);
          if (
            symbolStack.length &&
            symbolStack[symbolStack.length - 1].name === "IF_Control"
          ) {
            symbol = symbolStack[symbolStack.length - 1];
          }

          if (!symbol)
            throw new Error("Error: symbol is null. Possibly a bug!");

          if (symbol.yesChild) {
            rootComponent = (
              rootComponent as IF_Control
            )._right_Child.valueOf();
            symbol.noChild = trees;
          } else {
            symbolStack.push(symbol);
            symbol.yesChild = trees;
            rootComponent = (rootComponent as IF_Control)._left_Child.valueOf();
          }

          break;
        case "Oval":
        case "Oval_Procedure":
        case "Parallelogram":
        case "Rectangle":
          if (!symbol)
            throw new Error("Error: symbol is null. Possibly a bug!");
          rootComponent = rootComponent.successor?.valueOf();
          treesStack[treesStack.length - 1].push(symbol);
          break;
        default:
          throw new Error(`Unknown component: ${name}`);
      }
    }
    return treesStack[0];
  }
}
