import { Environment } from "./environment";
import { Token, TokenEnum } from "./tokenizer";

export interface Evaluatable {
  eval(env: Environment): any;
}

export enum ValueType {
  Undefined = 0, // not value is initialized
  String,
  Number,
  Boolean,
  Array,
}

export class Value {
  constructor(public value: any, public type: ValueType) {}
  copy() {
    return new Value(this.value, this.type);
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
          (args as PrimaryExpression).value.value
        );
        const ref = refV ?? new Value("undefined", ValueType.Undefined);
        parent!.setVariable(
          new VariableExpression((args as PrimaryExpression).value.value, true),
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
    const right = this.right!.eval(env) as Value;
    if (this.op === TokenEnum.Eq) {
      env.setVariable(
        new VariableExpression((this.left as PrimaryExpression).value.value),
        right.copy()
      );
      return;
    }
    const left = this.left!.eval(env) as Value;

    switch (this.op) {
      case TokenEnum.Lt:
        return new Value(left.value < right.value, ValueType.Boolean);
      case TokenEnum.LtEq:
        return new Value(left.value <= right.value, ValueType.Boolean);
      case TokenEnum.Gt:
        return new Value(left.value > right.value, ValueType.Boolean);
      case TokenEnum.GtEq:
        return new Value(left.value >= right.value, ValueType.Boolean);
      case TokenEnum.EqEq:
        return new Value(left.value == right.value, ValueType.Boolean);
      case TokenEnum.NotEq:
        return new Value(left.value != right.value, ValueType.Boolean);
      case TokenEnum.And:
        return new Value(left.value && right.value, ValueType.Boolean);
      case TokenEnum.Or:
        return new Value(left.value || right.value, ValueType.Boolean);
      case TokenEnum.Div:
        if (isNaN(parseInt(left.value)) || isNaN(parseInt(right.value)))
          return new Value("undefined", ValueType.Undefined);
        return new Value(left.value / right.value, ValueType.Number);
      case TokenEnum.Mul:
        if (isNaN(parseInt(left.value)) || isNaN(parseInt(right.value)))
          return new Value("undefined", ValueType.Undefined);
        return new Value(
          Number(left.value) * Number(right.value),
          ValueType.Number
        );
      case TokenEnum.Mod:
        if (isNaN(parseInt(left.value)) || isNaN(parseInt(right.value)))
          return new Value("undefined", ValueType.Undefined);
        return new Value(
          Number(left.value) % Number(right.value),
          ValueType.Number
        );
      case TokenEnum.Plus:
        if (left.type == ValueType.String || right.type == ValueType.String) {
          return new Value(left.value + right.value, ValueType.String);
        }
        return new Value(left.value + right.value, ValueType.Number);
      case TokenEnum.Minus:
        return new Value(left.value - right.value, ValueType.Number);
    }
  }
}
export class UnaryExpression implements Evaluatable {
  constructor(
    public readonly operator: TokenEnum,
    public readonly expr: Evaluatable
  ) {}
  eval(env: Environment) {
    const evaluated = this.expr.eval(env) as Value;
    if (evaluated.type !== ValueType.Number)
      throw new Error("Unary operator can only be applied to numbers");
    switch (this.operator) {
      case TokenEnum.Not:
        return new Value(!evaluated.value, ValueType.Boolean);
      case TokenEnum.Plus:
        return evaluated;
      case TokenEnum.Minus:
        return new Value(-1 * evaluated.value, ValueType.Number);
    }
  }
}

export class PrimaryExpression implements Evaluatable {
  constructor(public readonly value: Token) {}
  eval(env: Environment) {
    switch (this.value.type) {
      case TokenEnum.String:
        return new Value(this.value.value, ValueType.String);
      case TokenEnum.Number:
        return new Value(parseInt(this.value.value), ValueType.Number);
      case TokenEnum.True:
        return new Value(true, ValueType.Boolean);
      case TokenEnum.False:
        return new Value(false, ValueType.Boolean);
      case TokenEnum.Identifier:
        return env.getVariable(this.value.value.toLowerCase());
      default:
        throw new Error("Not implemented: " + TokenEnum[this.value.type]);
    }
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
    public readonly name: string,
    public readonly args: Evaluatable[] = []
  ) {}
  eval(env: Environment) {
    const stdFn = env.getFunction(this.name);
    const args = this.args.map((a) => a.eval(env));
    return stdFn?.call(stdFn, ...args);
  }
}
