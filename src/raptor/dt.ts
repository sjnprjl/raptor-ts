/**
 * Data types
 */

export enum ValueType {
  Undefined = 0,
  String,
  Number,
  Boolean,
  Array,
}

export abstract class RAP_Value<T> {
  constructor(public value: T, public type: ValueType) {}

  getValue() {
    return this.value;
  }

  abstract copy(): RAP_Value<T>;

  valueOf() {
    return this.value;
  }
  toString() {
    return this.value + "";
  }
}

export class RAP_Any extends RAP_Value<any> {
  copy(): RAP_Value<any> {
    return new RAP_Any(this.value, this.type);
  }
}
export class RAP_Number extends RAP_Value<number> {
  copy(): RAP_Number {
    return new RAP_Number(this.value);
  }
  constructor(public readonly value: number) {
    super(value, ValueType.Number);
  }
}
export class RAP_String extends RAP_Value<string> {
  constructor(public readonly value: string) {
    super(value, ValueType.String);
  }

  copy() {
    return new RAP_String(this.value);
  }
}
export class RAP_Boolean extends RAP_Value<boolean> {
  constructor(public readonly value: boolean) {
    super(value, ValueType.Boolean);
  }
  copy() {
    return new RAP_Boolean(this.value);
  }
}
export class RAP_Array extends RAP_Value<RAP_Any[] | RAP_Any[][]> {
  // array is always passed down by reference
  copy() {
    return this;
  }
  constructor(public readonly dimension = 1) {
    super(dimension == 1 ? [] : [[]], ValueType.Array);
  }

  getItem(prop: number[]) {
    if (prop.length !== this.dimension) {
      throw new Error(
        `Expected ${this.dimension} dimensions. Got ${prop.length}`
      );
    } else if (this.dimension == 1) {
      return this.value[prop[0]];
    } else if (this.dimension == 2) {
      const d1 = this.value[prop[0]] as RAP_Any[];
      return d1[prop[1]];
    }
  }
  setItem(prop: number[], value: RAP_Any) {
    if (prop.length !== this.dimension) {
      throw new Error(
        `Expected ${this.dimension} dimensions. Got ${prop.length}`
      );
    } else if (this.dimension == 1) {
      this.value[prop[0]] = value;
    } else if (this.dimension == 2) {
      const d1 = this.value[prop[0]] as RAP_Any[];
      d1[prop[1]] = value;
    }
  }
}
export class RAP_Undefined extends RAP_Value<undefined> {
  constructor() {
    super(undefined, ValueType.Undefined);
  }

  copy() {
    return new RAP_Undefined();
  }
}
