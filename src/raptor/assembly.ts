import { BinaryAssembly } from "../commonclasses";
import { ICloneable, Int32, OBoolean } from "../types";

abstract class BaseObject {
  objectId: number;
  constructor(objectId: number) {
    this.objectId = objectId;
  }
}

abstract class EnumBaseClass extends BaseObject {
  public value__?: Int32;
}

export class System_Int32 extends BaseObject {
  public m_value?: Int32;
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
    throw new Error("Method not implemented.");
  }
  public left!: Int32;
  public right!: Int32;
  public height!: Int32;
}

export class Event_Kind
  extends EnumBaseClass
  implements ICloneable<Event_Kind>
{
  clone(): Event_Kind {
    throw new Error("Method not implemented.");
  }
}

export class System_Guid extends BaseObject implements ICloneable<System_Guid> {
  clone(): System_Guid {
    const guid = new System_Guid(this.objectId);
    return guid;
  }
}
export class Oval extends BaseObject implements ICloneable<Oval> {
  clone(): Oval {
    throw new Error("Method not implemented.");
  }
  public _serialization_version!: Int32;
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
    rect.x = rect.x.clone();
    rect.y = rect.y.clone();
    rect.width = rect.width.clone();
    rect.height = rect.height.clone();
    return rect;
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
      Parallelogram: System_Drawing_Rectangle,
      logging_info: Logging_Info,
      "logging_info+event_kind": Event_Kind,
    },
  },
  3: {
    System: {
      Drawing: {
        Rectangle: Object,
      },
    },
  },
} as const;
