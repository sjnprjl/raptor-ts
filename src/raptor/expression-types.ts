import {
  RAP_Any,
  RAP_Array,
  RAP_Boolean,
  RAP_Number,
  RAP_String,
  RAP_Undefined,
  ValueType,
} from "./dt";
import { Environment } from "./environment";
import { Token, TokenEnum } from "./tokenizer";

export interface Evaluatable {
  eval(env: Environment): any;
}

export class AssignmentExpression implements Evaluatable {
  constructor(
    public readonly left: MemberExpression | IdentifierExpression,
    public readonly right: Evaluatable
  ) {}
  eval(env: Environment) {
    if (this.left instanceof IdentifierExpression) {
      env.setVariable(
        new VariableExpression(this.left.value.value),
        this.right.eval(env).copy()
      );
    } else if (this.left instanceof MemberExpression) {
      const props = this.left.property.eval(env) as RAP_Number[];
      let array: RAP_Any | undefined = undefined;
      try {
        array = this.left.identifier.eval(env) as RAP_Array;
      } catch (err) {
        // if not found, it means, array is being initialized
        if (this.left.identifier instanceof IdentifierExpression) {
          env.setVariable(
            new VariableExpression(this.left.identifier.value.value),
            (array = new RAP_Array(props.length))
          );
        }
      }

      if (!(array instanceof RAP_Array)) {
        throw new Error("Only array has members.");
      }

      const properties = props.map((p) => {
        if (p.type !== ValueType.Number)
          throw new Error("Only number is allowed.");
        return p.value;
      });
      array.setItem(properties, this.right.eval(env).copy());
    }
  }
}

export class IdentifierExpression implements Evaluatable {
  constructor(public readonly value: Token) {}
  eval(env: Environment) {
    const foundVariable = env.getVariableSoft(this.value.value);
    if (!foundVariable) {
      // check for function
      const foundFunction = env.getFunction(this.value.value);
      if (!foundFunction) {
        throw new Error(`variable ${this.value.value} is not found.`);
      } else return foundFunction;
    } else return foundVariable;
  }
}

export class MemberExpression implements Evaluatable {
  constructor(
    public readonly identifier: Evaluatable,
    public readonly property: ArrayExpression
  ) {}
  eval(env: Environment) {
    const identifier = this.identifier.eval(env);
    if (identifier instanceof Function || !(identifier instanceof RAP_Array)) {
      throw new Error("Only array has members.");
    }
    const property = this.property.eval(env) as RAP_Number[];
    property.forEach((p) => {
      if (p.type !== ValueType.Number)
        throw new Error("Only number is allowed.");
    });
    const props = property.map((p) => p.value);

    return identifier.getItem(props);
  }
}

export class ArrayExpression implements Evaluatable {
  constructor(public readonly elements: Evaluatable[]) {}
  eval(env: Environment) {
    return this.elements.map((e) => e.eval(env));
  }
}

export class VariableExpression implements Evaluatable {
  constructor(public readonly name: string, public readonly ref = false) {}
  eval(env: Environment) {
    return env.getVariable(this.name);
  }
}

export class FunctionDeclaration implements Evaluatable {
  private _args: Evaluatable[] = [];
  constructor(public readonly name: string, public params: FuncParameter[]) {}
  eval(env: Environment) {
    const parent = env.getParent();
    env.setParent(null);
    for (let i = 0; i < this.params.length; i++) {
      const param = this.params[i];
      const args = this._args[i];
      if (param.type === "in" || param.type === "both") {
        env.setVariable(param.ident, args.eval(parent!));
      } else {
        const refV = parent!.getVariableSoft(
          (args as LiteralExpression).value.value
        );
        const ref = refV ?? new RAP_Undefined();
        parent!.setVariable(
          new VariableExpression((args as LiteralExpression).value.value, true),
          ref
        );
        env.setVariable(param.ident, ref);
      }
    }
  }
  set args(args: Evaluatable[]) {
    this._args = args;
  }
}

export class FuncParameter implements Evaluatable {
  constructor(
    public type: "in" | "out" | "both",
    public ident: VariableExpression
  ) {}

  eval(env: Environment) {
    throw new Error("Method not implemented.");
  }
}

export class BinaryExpression implements Evaluatable {
  constructor(
    public left: Evaluatable | null,
    public op: TokenEnum,
    public right: Evaluatable | null
  ) {}

  eval(env: Environment) {
    const right = this.right!.eval(env) as RAP_Any;
    const left = this.left!.eval(env) as RAP_Any;

    switch (this.op) {
      case TokenEnum.Lt:
        return new RAP_Boolean(left.value < right.value);
      case TokenEnum.LtEq:
        return new RAP_Boolean(left.value <= right.value);
      case TokenEnum.Gt:
        return new RAP_Boolean(left.value > right.value);
      case TokenEnum.GtEq:
        return new RAP_Boolean(left.value >= right.value);
      case TokenEnum.EqEq:
        return new RAP_Boolean(left.value == right.value);
      case TokenEnum.NotEq:
        return new RAP_Boolean(left.value != right.value);
      case TokenEnum.And:
        return new RAP_Boolean(left.value && right.value);
      case TokenEnum.Or:
        return new RAP_Boolean(left.value || right.value);
      case TokenEnum.Div:
        if (isNaN(parseInt(left.value)) || isNaN(parseInt(right.value)))
          return new RAP_Undefined();
        return new RAP_Number(left.value / right.value);
      case TokenEnum.Mul:
        if (isNaN(parseInt(left.value)) || isNaN(parseInt(right.value)))
          return new RAP_Undefined();
        return new RAP_Number(Number(left.value) * Number(right.value));
      case TokenEnum.Mod:
        if (isNaN(parseInt(left.value)) || isNaN(parseInt(right.value)))
          return new RAP_Undefined();
        return new RAP_Number(Number(left.value) % Number(right.value));
      case TokenEnum.Plus:
        const l = +left.value;
        const r = +right.value;
        if (isNaN(l) || isNaN(r))
          return new RAP_String(left.value + right.value);
        return new RAP_Number(l + r);
      case TokenEnum.Minus: {
        const l = +left.value;
        const r = +right.value;
        if (isNaN(l) || isNaN(r)) return new RAP_Undefined();
        return new RAP_Number(left.value - right.value);
      }
    }
  }
}
export class UnaryExpression implements Evaluatable {
  constructor(
    public readonly operator: TokenEnum,
    public readonly expr: Evaluatable
  ) {}
  eval(env: Environment) {
    const evaluated = this.expr.eval(env) as RAP_Number;
    switch (this.operator) {
      case TokenEnum.Not:
        return new RAP_Boolean(!evaluated.value);
      case TokenEnum.Plus:
        return evaluated;
      case TokenEnum.Minus:
        return new RAP_Number(-1 * evaluated.value);
    }
  }
}

export class LiteralExpression implements Evaluatable {
  constructor(public readonly value: RAP_Any) {}
  eval(env: Environment) {
    return this.value;
  }
}

export class GroupExpression implements Evaluatable {
  constructor(public readonly expr: Evaluatable) {}
  eval(env: Environment) {
    return this.expr.eval(env);
  }
}

export class CallExpression implements Evaluatable {
  constructor(
    public readonly name:
      | LiteralExpression
      | IdentifierExpression
      | GroupExpression
      | ArrayExpression,
    public readonly args: Evaluatable[] = []
  ) {}
  eval(env: Environment) {
    const fn = this.name.eval(env) as Function;
    const args = this.args.map((a) => a.eval(env));
    return fn?.call(fn, ...args);
  }
}
