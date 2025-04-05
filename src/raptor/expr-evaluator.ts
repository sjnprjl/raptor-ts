import { LOG } from "../utils";
import { Environment } from "./environment";
import { Token, TokenEnum, Tokenizer } from "./tokenizer";

interface Evaluatable {
  eval(env: Environment): any;
}

export class BinaryExpression implements Evaluatable {
  constructor(
    public left: Evaluatable | null,
    public op: TokenEnum,
    public right: Evaluatable | null
  ) {}

  eval(env: Environment) {
    const right = this.right!.eval(env);
    if (this.op === TokenEnum.Eq) {
      env.setVariable(
        (this.left as PrimaryExpression).value.value.toLocaleLowerCase(),
        right
      );
      return;
    }
    const left = this.left!.eval(env);

    switch (this.op) {
      case TokenEnum.Lt:
        return left < right;
      case TokenEnum.LtEq:
        return left <= right;
      case TokenEnum.Gt:
        return left > right;
      case TokenEnum.GtEq:
        return left >= right;
      case TokenEnum.EqEq:
        return left == right;
      case TokenEnum.NotEq:
        return left != right;
      case TokenEnum.And:
        return left && right;
      case TokenEnum.Or:
        return left || right;
      case TokenEnum.Div:
        return Number(left) / Number(right);
      case TokenEnum.Mul:
        return Number(left) * Number(right);
      case TokenEnum.Mod:
        return Number(left) % Number(right);
      case TokenEnum.Plus:
        return left + right;
      case TokenEnum.Minus:
        return left - right;
    }
  }
}
class UnaryExpression implements Evaluatable {
  constructor(
    public readonly operator: TokenEnum,
    public readonly expr: Evaluatable
  ) {}
  eval(env: Environment) {
    switch (this.operator) {
      case TokenEnum.Not:
        return !this.expr.eval(env);
      case TokenEnum.Plus:
        return this.expr.eval(env);
      case TokenEnum.Minus:
        return -this.expr.eval(env);
    }
  }
}

export class PrimaryExpression implements Evaluatable {
  constructor(public readonly value: Token) {}
  eval(env: Environment) {
    switch (this.value.type) {
      case TokenEnum.String:
        return this.value.value;
      case TokenEnum.Number:
        return Number(this.value.value);
      case TokenEnum.True:
        return true;
      case TokenEnum.False:
        return false;
      case TokenEnum.Identifier:
        return env.getVariable(this.value.value.toLowerCase());
    }
  }
}

class GroupExpression implements Evaluatable {
  constructor(public readonly expr: Evaluatable) {}
  eval(env: Environment) {
    return this.expr.eval(env);
  }
}

function group_expr(tokenizer: Tokenizer) {
  // already eaten
  // if (!tokenizer.nextIfTrue(({ type }) => type === TokenEnum.ParenOpen)) {
  //   throw new Error("Expected '('");
  // }
  const expression = expr(tokenizer);
  if (!tokenizer.nextIfTrue(({ type }) => type === TokenEnum.ParenClose)) {
    LOG(expression);
    throw new Error("Expected ')' but got " + tokenizer.next()?.value);
  }
  return new GroupExpression(expression);
}

function prim_expr(tokenizer: Tokenizer) {
  const token = tokenizer.next();
  if (!token) throw new Error("Expected expression");

  if (token.type === TokenEnum.ParenOpen) return group_expr(tokenizer);

  if (token.type === TokenEnum.Identifier) {
    const isCall = tokenizer.nextIfTrue(
      ({ type }) => type === TokenEnum.ParenOpen
    );
    if (isCall) {
      // call expression
      const cexpr = new CallExpression(token.value);
      cexpr.args.push(expr(tokenizer));
      while (tokenizer.nextIfTrue(({ type }) => type === TokenEnum.Comma)) {
        if (tokenizer.nextIfTrue(({ type }) => type === TokenEnum.ParenClose))
          break;
        cexpr.args.push(expr(tokenizer));
      }
      tokenizer.next(); // eat ')
      return cexpr;
    }
  }

  return new PrimaryExpression(token);
}

function unary_expr(tokenizer: Tokenizer) {
  const unary_operator = tokenizer.nextIfTrue(({ type }) =>
    [TokenEnum.Not, TokenEnum.Plus, TokenEnum.Minus].some((t) => t === type)
  );

  if (unary_operator === false) {
    return prim_expr(tokenizer);
  } else {
    return new UnaryExpression(unary_operator.type, prim_expr(tokenizer));
  }
}

function mult_expr(
  tokenizer: Tokenizer,
  expr = new BinaryExpression(null, TokenEnum.Invalid, null)
) {
  const left = unary_expr(tokenizer);
  let op;
  if (
    (op = tokenizer.nextIfTrue(
      ({ type }) => type === TokenEnum.Mul || type === TokenEnum.Div
    ))
  ) {
    expr.left = left;
    expr.op = (op as Token).type;
    expr.right = mult_expr(tokenizer);
    return expr;
  } else {
    return left;
  }
}

function add_expr(
  tokenizer: Tokenizer,
  expr = new BinaryExpression(null, TokenEnum.Invalid, null)
) {
  const left = mult_expr(tokenizer);
  let op;
  if (
    (op = tokenizer.nextIfTrue(
      ({ type }) => type === TokenEnum.Plus || type === TokenEnum.Minus
    ))
  ) {
    expr.left = left;
    expr.op = (op as Token).type;
    expr.right = add_expr(tokenizer);
    return expr;
  } else {
    return left;
  }
}

function rel_expr(
  tokenizer: Tokenizer,
  expr = new BinaryExpression(null, TokenEnum.Invalid, null)
) {
  const left = add_expr(tokenizer);
  let op;
  if (
    (op = tokenizer.nextIfTrue(
      ({ type }) =>
        type === TokenEnum.Lt ||
        type === TokenEnum.LtEq ||
        type === TokenEnum.Gt ||
        type === TokenEnum.GtEq
    ))
  ) {
    expr.left = left;
    expr.op = (op as Token).type;
    expr.right = add_expr(tokenizer);
    return expr;
  } else {
    return left;
  }
}

function eq_expr(
  tokenizer: Tokenizer,
  expr = new BinaryExpression(null, TokenEnum.EqEq, null)
) {
  const left = rel_expr(tokenizer);
  if (tokenizer.nextIfTrue(({ type }) => type === TokenEnum.EqEq)) {
    expr.left = left;
    expr.right = eq_expr(tokenizer);
    return expr;
  } else {
    return left;
  }
}

function and_expr(
  tokenizer: Tokenizer,
  expr = new BinaryExpression(null, TokenEnum.And, null)
) {
  const left = eq_expr(tokenizer);
  if (tokenizer.nextIfTrue(({ type }) => type === TokenEnum.And)) {
    expr.left = left;
    expr.right = eq_expr(tokenizer);
    return expr;
  } else {
    return left;
  }
}

function or_expr(
  tokenizer: Tokenizer,
  expr = new BinaryExpression(null, TokenEnum.Or, null)
) {
  const left = and_expr(tokenizer);
  if (tokenizer.nextIfTrue(({ type }) => type === TokenEnum.Or)) {
    expr.left = left;
    expr.right = eq_expr(tokenizer);
    return expr;
  } else {
    return left;
  }
}

export function condition_expr(tokenizer: Tokenizer) {
  const expr = or_expr(tokenizer);
  return expr;
}

export function assignment_expr(tokenizer: Tokenizer) {
  const ident = prim_expr(tokenizer);
  if (ident instanceof GroupExpression || ident instanceof CallExpression)
    throw new Error("Expected identifier");
  if (ident.value.type !== TokenEnum.Identifier)
    throw new Error(
      "Expected identifier but got " + TokenEnum[ident.value.type]
    );
  if (!tokenizer.nextIfTrue(({ type }) => type === TokenEnum.Eq)) {
    throw new Error("Expected ':=' after identifier ");
  }
  const expr = condition_expr(tokenizer);
  return new BinaryExpression(ident, TokenEnum.Eq, expr);
}

class CallExpression implements Evaluatable {
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

export function expr(tokenizer: Tokenizer): Evaluatable {
  const expression = condition_expr(tokenizer);

  return expression;
}
