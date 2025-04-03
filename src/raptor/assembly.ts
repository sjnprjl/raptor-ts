import {
  ObjectNull,
  ObjectString,
  SerializedStreamHeader,
} from "../commonclasses";
import { Byte, ICloneable, Int16, Int32, OBoolean } from "../types";

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
}

export class Component extends BaseObject implements ICloneable<Component> {
  _serialization!: Int32;
  _FP!: Ref<FootPrint>;
  _x_location!: Int32;
  _y_location!: Int32;
  _parent!: Ref<Component> | ObjectNull;
  _Successor!: Ref<Component> | ObjectNull;

  clone() {
    const comp = new Component(this.objectId);
    comp._serialization = this._serialization.clone();
    comp._FP = this._FP.clone();
    comp._x_location = this._x_location.clone();
    comp._y_location = this._y_location.clone();
    comp._parent = this._parent.clone();
    return comp;
  }
}

export class Ref<T extends ICloneable<T>> implements ICloneable<Ref<T>> {
  public ref?: T;
  constructor(public mapId: Int32) {}
  clone() {
    const ref = new Ref<T>(this.mapId);
    ref.ref = this.ref;
    return ref;
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

export class Subchart_Kinds
  extends EnumBaseClass
  implements ICloneable<Subchart_Kinds>
{
  clone(): Subchart_Kinds {
    const kind = new Subchart_Kinds(this.objectId);
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
  public _a!: Int32;
  public _b!: Int16;
  public _c!: Byte;
  public _d!: Byte;
  public _e!: Byte;
  public _f!: Byte;
  public _g!: Byte;
  public _h!: Byte;
  public _i!: Byte;
  public _j!: Byte;
  public _k!: Byte;
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

export class Parallelogram
  extends BaseObject
  implements ICloneable<Parallelogram>
{
  _prompt!: ObjectString;
  _is_input!: OBoolean;
  _new_line!: OBoolean;
  _input_expression!: OBoolean;
  _serialization_version!: Int32;
  _FP!: Ref<FootPrint>;
  _text_str!: ObjectString;
  _name!: ObjectString | Ref<ObjectString>;
  _proximity!: Int32;
  _head_height!: Int32;
  _head_width!: Int32;
  _head_heightOrig!: Int32;
  _head_widthOrig!: Int32;
  _connector_length!: Int32;
  _x_location!: Int32;
  _y_location!: Int32;
  _Successor!: Ref<ObjectNull>;
  _parent!: ObjectNull | unknown;
  _is_child!: OBoolean;
  _is_beforeChild!: OBoolean;
  _is_afterChild!: OBoolean;
  _full_text!: OBoolean;
  _height_of_text!: Int32;
  _char_length!: Int32;
  _rect!: System_Drawing_Rectangle | Ref<System_Drawing_Rectangle>;
  _comment!: ObjectNull | unknown;
  _created_guid!: System_Guid;
  _changed_guid!: System_Guid;
  clone(): Parallelogram {
    const parallelogram = new Parallelogram(this.objectId);
    return parallelogram;
  }
}

export class IF_Control extends Component implements ICloneable<IF_Control> {
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

  clone(): IF_Control {
    const ifCtrl = new IF_Control(this.objectId);
    ifCtrl._left_Child = this._left_Child?.clone();
    ifCtrl._right_Child = this._right_Child?.clone();
    return ifCtrl;
  }
}

export class Oval extends Component implements ICloneable<Oval> {
  _text_str!: ObjectString;
  _name!: ObjectString;
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
  _rect!: System_Drawing_Rectangle;
  _comment!: ObjectNull | CommentBox | Ref<CommentBox>;
  _created_guid!: System_Guid;
  _changed_guid!: System_Guid;

  clone(): Oval {
    const oval = new Oval(this.objectId);
    return oval;
  }
}

export class Logging_Info
  extends EnumBaseClass
  implements ICloneable<Logging_Info>
{
  clone(): Logging_Info {
    throw new Error("Method not implemented.");
  }
}

export class System_Drawing_Rectangle
  extends BaseObject
  implements ICloneable<System_Drawing_Rectangle>
{
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
}
export class Rectangle extends Component implements ICloneable<Rectangle> {
  clone() {
    const rect = new Rectangle(this.objectId);
    rect._FP = this._FP?.clone();

    return rect;
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
}

export class Loop extends BaseObject implements ICloneable<Loop> {
  clone() {
    const loop = new Loop(this.objectId);
    return loop;
  }
}
export class Oval_Procedure extends BaseObject {}

export class CommentBox extends BaseObject implements ICloneable<CommentBox> {
  clone() {
    return new CommentBox(this.objectId);
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
      Subchart_Kinds: Subchart_Kinds,
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
