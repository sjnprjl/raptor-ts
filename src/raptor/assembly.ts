import {
  ObjectNull,
  ObjectString,
  SerializedStreamHeader,
} from "../binary-parser/commonclasses";
import {
  Byte,
  DateTime,
  ICloneable,
  Int16,
  Int32,
  OBoolean,
} from "../binary-parser/types";
import {
  CalleeExpression,
  CallExpression,
  IdentifierExpression,
  LiteralExpression,
  VariableExpression,
} from "./expression-types";
import { RaptorInterpreter } from "./interpreter";
import { parseExpression } from "./parser";
import { Tokenizer } from "./tokenizer";

enum RectangleKindE {
  VariableAssignment = 0,
  FunctionCall = 1,
  Invalid,
}

export abstract class BaseObject implements ICloneable<BaseObject> {
  objectId: number;
  constructor(objectId: number) {
    this.objectId = objectId;
  }
  clone(): BaseObject {
    throw new Error("Method not implemented.");
  }
}

export class ASM_Object<TObject extends BaseObject> {
  public object!: TObject;
  public header!: SerializedStreamHeader;

  valueOf() {
    return this.object;
  }
}

export class OString extends BaseObject implements ICloneable<OString> {
  private _value: string = "";

  clone() {
    const s = new OString(this.objectId);
    s.value = this._value;
    return s;
  }
  set value(v: string) {
    this._value = v;
  }
  get value() {
    return this._value;
  }
}

export class Component extends BaseObject {
  _serialization!: Int32;
  _FP!: Ref<FootPrint>;
  _x_location!: Int32;
  _y_location!: Int32;
  _parent!: Ref<Component> | ObjectNull;
  _Successor!: Ref<Component> | ObjectNull;
  _text_str!: ObjectString;
  _comment!: ObjectNull | CommentBox | Ref<CommentBox>;
  _rect!: System_Drawing_Rectangle | Ref<System_Drawing_Rectangle>;
  _proximity!: Int32;
  _head_height!: Int32;
  _head_heightOrig!: Int32;
  _head_widthOrig!: Int32;
  _connector_length!: Int32;
  _is_child!: OBoolean;
  _is_beforeChild!: OBoolean;
  _is_afterChild!: OBoolean;
  _full_text!: OBoolean;
  _height_of_text!: Int32;
  _char_length!: Int32;
  _created_guid!: System_Guid;
  _changed_guid!: System_Guid;
  private _name!: ObjectString | Ref<ObjectString>;

  getRect() {
    return this._rect;
  }

  getComment() {
    return this._comment.valueOf();
  }

  getName() {
    if (!this._name) return null;

    const output = this._name.valueOf();
    if (typeof output === "object") return output.valueOf();
    return output;
  }

  get successor(): null | Component | undefined {
    return this._Successor.valueOf();
  }

  get rect() {
    return this._rect.valueOf();
  }

  get comment(): null | CommentBox | undefined {
    return this._comment.valueOf();
  }
}

export class Ref<T> {
  public ref?: T;
  constructor(public mapId: Int32) {}
  valueOf(): T | undefined {
    return this.ref;
  }
  toString() {
    return `Ref<${this.ref?.toString()}>`;
  }
}

abstract class EnumBaseClass extends BaseObject {
  public value__?: Int32;
}

export class System_Int32 extends BaseObject {
  public m_value!: Int32;

  valueOf() {
    return this.m_value.valueOf();
  }
}
export class System_Boolean extends BaseObject {
  public m_value?: OBoolean;
}

export class Sub_Chart_Kinds
  extends EnumBaseClass
  implements ICloneable<Sub_Chart_Kinds>
{
  clone(): Sub_Chart_Kinds {
    const kind = new Sub_Chart_Kinds(this.objectId);
    kind.value__ = this.value__;
    return kind;
  }
}
export class FootPrint extends BaseObject implements ICloneable<FootPrint> {
  clone(): FootPrint {
    const footPrint = new FootPrint(this.objectId);
    footPrint.left = this.left?.clone();
    footPrint.right = this.right?.clone();
    footPrint.height = this.height?.clone();
    return footPrint;
  }
  public left?: Int32;
  public right?: Int32;
  public height?: Int32;
}

export class Event_Kind
  extends EnumBaseClass
  implements ICloneable<Event_Kind>
{
  clone(): Event_Kind {
    const kind = new Event_Kind(this.objectId);
    kind.value__ = this.value__?.clone();
    return kind;
  }
}

export class System_Guid extends BaseObject implements ICloneable<System_Guid> {
  private _a!: Int32;
  private _b!: Int16;
  private _c!: Byte;
  private _d!: Byte;
  private _e!: Byte;
  private _f!: Byte;
  private _g!: Byte;
  private _h!: Byte;
  private _i!: Byte;
  private _j!: Byte;
  private _k!: Byte;
  clone(): System_Guid {
    const guid = new System_Guid(this.objectId);
    guid._a = this._a.clone();
    guid._b = this._b.clone();
    guid._c = this._c.clone();
    guid._d = this._d.clone();
    guid._e = this._e.clone();
    guid._f = this._f.clone();
    guid._g = this._g.clone();
    guid._h = this._h.clone();
    guid._i = this._i.clone();
    guid._j = this._j.clone();
    guid._k = this._k.clone();

    return guid;
  }
}

export class Parallelogram extends Component {
  public _prompt!: ObjectString;
  public _new_line!: OBoolean;
  public _is_input!: OBoolean;
  public _input_expression!: OBoolean;

  toString() {
    return `Parallelogram`;
  }

  valueOf() {
    return this;
  }

  isInput() {
    return this._is_input;
  }

  next(interpreter: RaptorInterpreter) {
    const is_input = this._is_input.valueOf();

    let source = this._prompt.valueOf();
    let variable = "";
    if (!is_input) {
      source = this._text_str.valueOf();
    } else {
      variable = this._text_str.valueOf();
    }

    const varExpr = is_input ? interpreter.parseExpression(variable) : null;
    const promptSourceExpr = interpreter.parseExpression(source);

    if (is_input) {
      interpreter.evaluateRead(
        promptSourceExpr,
        new VariableExpression((varExpr as LiteralExpression).value.value)
      );
    } else {
      interpreter.evaluateWrite(promptSourceExpr);
    }

    return this._Successor;
  }

  parse(tokenizer: Tokenizer) {
    const isInput = this._is_input.valueOf();

    let source = this._prompt.valueOf();
    let variable = "";
    if (!isInput) {
      source = this._text_str.valueOf();
    } else {
      variable = this._text_str.valueOf();
    }

    tokenizer.tokenize(variable);
    const varExpr = parseExpression(tokenizer);
    tokenizer.tokenize(source);
    const promptSourceExpr = parseExpression(tokenizer);

    return { varExpr, promptSourceExpr, isInput };
  }
}

export class IF_Control extends Component {
  _left_Child!: Ref<Component> | ObjectNull;
  _right_Child!: Ref<Component> | ObjectNull;
  _bottom!: Int32;
  _min_bottom!: Int32;
  _x_left!: Int32;
  _y_left!: Int32;
  _x_right!: Int32;
  _y_right!: Int32;
  _left_connector_y!: Int32;
  _right_connector_y!: Int32;
  _line_height!: Int32;
  _is_compressed!: OBoolean;
  _text_str!: ObjectString;

  get leftChild() {
    return this._left_Child.valueOf();
  }

  getTrueChild() {
    return this._left_Child.valueOf();
  }
  get rightChild() {
    return this._right_Child.valueOf();
  }

  // this component is called when condition is unsatisfied
  getFalseChild() {
    return this.rightChild;
  }

  next(interpreter: RaptorInterpreter) {
    const source = this._text_str.valueOf();
    const cond = interpreter.evaluateIfExpression(source);
    if (cond === true) return this._left_Child;
    else return this._right_Child;
  }

  toString() {
    return `IF_Control(${this._text_str.valueOf()})`;
  }
}

export class Oval extends Component {
  toString() {
    return `Oval(${this._text_str.valueOf()})`;
  }

  next(interpreter: RaptorInterpreter) {
    const _text_str = this._text_str.valueOf();
    if (_text_str === "Start") {
      interpreter.evaluateSubChart();
    } else if (_text_str === "End") {
    } else {
      throw new Error("Unknown command: " + _text_str);
    }
    return this._Successor;
  }
}

export class Logging_Info extends BaseObject {
  private _count!: Int32;
  private _users: ObjectString[] = [];
  private _machines: ObjectString[] = [];
  private _dates: DateTime[] = [];

  getCount() {
    return this._count;
  }
  getUsers() {
    return this._users;
  }
  getMachines() {
    return this._machines;
  }
  getDates() {
    return this._dates;
  }

  setAttribute(attrName: string, value: ObjectString | DateTime | Int32): void {
    if (attrName.includes("_count")) this._count = value as Int32;
    else {
      const attrReg = /(\w+)(\d+)/.exec(attrName);
      const index = Number(attrReg?.[2]);
      const attr = (attrReg?.[1] + "s") as "_users" | "_machines" | "_dates";
      this[attr][index] = value as DateTime | ObjectString;
    }
  }
}

export class System_Drawing_Rectangle extends BaseObject {
  public x!: Int32;
  public y!: Int32;
  public width!: Int32;
  public height!: Int32;
  clone(): System_Drawing_Rectangle {
    const rect = new System_Drawing_Rectangle(this.objectId);

    rect.x = this.x.clone();
    rect.y = this.y.clone();
    rect.width = this.width.clone();
    rect.height = this.height.clone();
    return rect;
  }

  override valueOf() {
    return this;
  }
}
export class Rectangle extends Component {
  private _kind!: Rectangle_Kind_Of;

  valueOf() {
    return this;
  }

  toString() {
    return `Rectangle(${this._text_str.valueOf()})`;
  }

  isFunctionCall() {
    return this._kind.getEnum() === RectangleKindE.FunctionCall;
  }

  next(interpreter: RaptorInterpreter) {
    const kind = this._kind.getEnum();
    const source = this._text_str.valueOf();
    switch (kind) {
      case RectangleKindE.VariableAssignment:
        interpreter.evaluateAssignmentExpression(source);
        return this._Successor;
      case RectangleKindE.FunctionCall:
        const expression = interpreter.evaluateCallExpression(source);

        let name = "";
        if (expression instanceof IdentifierExpression) {
          name = expression.value.value;
        } else if (expression instanceof CallExpression) {
          if (
            expression.name instanceof CalleeExpression &&
            expression.name.value instanceof IdentifierExpression
          ) {
            name = expression.name.value.value.value;
          } else {
            console.log({ expression });
            throw new Error(
              "callee should be a identifier expression. Other are not allowed."
            );
          }
        } else {
          throw new Error(
            "callee should be a identifier expression or call expression. Other are not allowed."
          );
        }

        const procedure = interpreter.env.getSubChart(name);
        if (!procedure)
          throw new Error(`Not found: SubChart '${name}' not found`);

        return procedure;
      default:
      // unreachable
    }
  }
}
export class Rectangle_Kind_Of
  extends EnumBaseClass
  implements ICloneable<Rectangle_Kind_Of>
{
  clone(): Rectangle_Kind_Of {
    const rect = new Rectangle_Kind_Of(this.objectId);
    rect.value__ = this.value__;
    return rect;
  }

  getEnum() {
    if (this.value__?.valueOf() == 0) return RectangleKindE.VariableAssignment;
    else if (this.value__?.valueOf() == 1) return RectangleKindE.FunctionCall;
    else return RectangleKindE.Invalid;
  }
}

export class Loop extends Component {
  private _after_Child?: Ref<Component> | ObjectNull;
  private _before_Child?: Ref<Component> | ObjectNull;
  toString() {
    return `Loop(${this._text_str.valueOf()})`;
  }
  next(__interpreter: RaptorInterpreter) {
    const conditional_source = this._text_str.valueOf();
    const block = __interpreter.peekBlockStack();

    if (block === "loop_start") {
      __interpreter.popStack();
      const cond = __interpreter.evaluateLoopCondition(conditional_source);
      if (!cond /** if (condition satisfies to goes out of the block) */) {
        __interpreter.pushLoopBodyToStack();
        return this._after_Child;
      } else return this._Successor;
    } else {
      // I think this condition always satisfy?
      if (block === "loop_body") __interpreter.popStack();
      __interpreter.pushLoopStartToStack();
      return this._before_Child;
    }
  }
}
export class Oval_Procedure extends Component {
  private _numParams!: Int32;

  get numParams() {
    return this._numParams.valueOf();
  }

  next(__interpreter: RaptorInterpreter) {
    const source = this._text_str.valueOf();
    __interpreter.evaluateProcedure(source);

    return this._Successor;
  }

  toString() {
    return `Oval_Procedure(${this._text_str.valueOf()})`;
  }
}

export class CommentBox extends BaseObject implements ICloneable<CommentBox> {
  clone() {
    return new CommentBox(this.objectId);
  }
  valueOf() {
    return this;
  }
}

export const assembly = {
  0: {
    System: {
      Int32: System_Int32,
      Boolean: System_Boolean,
      Guid: System_Guid,
    },
  },
  2: {
    raptor: {
      Subchart_Kinds: Sub_Chart_Kinds,
      Oval: Oval,
      "Component+FootPrint": FootPrint,
      Parallelogram: Parallelogram,
      logging_info: Logging_Info,
      "logging_info+event_kind": Event_Kind,
      IF_Control,
      Rectangle,
      "Rectangle+Kind_Of": Rectangle_Kind_Of,
      CommentBox,
      Loop,
      Oval_Procedure,
    },
  },
  3: {
    System: {
      Drawing: {
        Rectangle: System_Drawing_Rectangle,
      },
    },
  },
} as const;
