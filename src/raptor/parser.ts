import { LOG } from "../utils";
import {
  BinaryExpression,
  CallExpression,
  Evaluatable,
  FunctionDeclaration,
  FuncParameter,
  GroupExpression,
  PrimaryExpression,
  UnaryExpression,
  VariableExpression,
} from "./expression-types";
import { Token, TokenEnum, Tokenizer } from "./tokenizer";

export function parse_group_expr(tokenizer: Tokenizer) {
  const expression = parse_expression(tokenizer);
  if (!tokenizer.nextIfTrue(({ type }) => type === TokenEnum.ParenClose)) {
    LOG(expression);
    throw new Error("Expected ')' but got " + tokenizer.next()?.value);
  }
  return new GroupExpression(expression);
}

export function parse_primary_expression(tokenizer: Tokenizer) {
  const token = tokenizer.next();
  if (!token) throw new Error("Expected expression");

  if (token.type === TokenEnum.ParenOpen) return parse_group_expr(tokenizer);

  if (token.type === TokenEnum.Identifier) {
    const isCall = tokenizer.nextIfTrue(
      ({ type }) => type === TokenEnum.ParenOpen
    );
    if (isCall) {
      // call expression
      const cexpr = new CallExpression(token.value);
      cexpr.args.push(parse_expression(tokenizer));
      while (tokenizer.nextIfTrue(({ type }) => type === TokenEnum.Comma)) {
        if (tokenizer.nextIfTrue(({ type }) => type === TokenEnum.ParenClose))
          break;
        cexpr.args.push(parse_expression(tokenizer));
      }
      tokenizer.next(); // eat ')
      return cexpr;
    }
  }

  return new PrimaryExpression(token);
}

function parse_unary_expression(tokenizer: Tokenizer) {
  const unary_operator = tokenizer.nextIfTrue(({ type }) =>
    [TokenEnum.Not, TokenEnum.Plus, TokenEnum.Minus].some((t) => t === type)
  );

  if (unary_operator === false) {
    return parse_primary_expression(tokenizer);
  } else {
    return new UnaryExpression(
      unary_operator.type,
      parse_primary_expression(tokenizer)
    );
  }
}

function parse_multiplicative_expression(
  tokenizer: Tokenizer,
  expr = new BinaryExpression(null, TokenEnum.Invalid, null)
) {
  const left = parse_unary_expression(tokenizer);
  let op;
  if (
    (op = tokenizer.nextIfTrue(
      ({ type }) => type === TokenEnum.Mul || type === TokenEnum.Div
    ))
  ) {
    expr.left = left;
    expr.op = (op as Token).type;
    expr.right = parse_multiplicative_expression(tokenizer);
    return expr;
  } else {
    return left;
  }
}

function parse_additive_expression(
  tokenizer: Tokenizer,
  expr = new BinaryExpression(null, TokenEnum.Invalid, null)
) {
  const left = parse_multiplicative_expression(tokenizer);
  let op;
  if (
    (op = tokenizer.nextIfTrue(
      ({ type }) => type === TokenEnum.Plus || type === TokenEnum.Minus
    ))
  ) {
    expr.left = left;
    expr.op = (op as Token).type;
    expr.right = parse_additive_expression(tokenizer);
    return expr;
  } else {
    return left;
  }
}

function parse_relational_expression(
  tokenizer: Tokenizer,
  expr = new BinaryExpression(null, TokenEnum.Invalid, null)
) {
  const left = parse_additive_expression(tokenizer);
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
    expr.right = parse_additive_expression(tokenizer);
    return expr;
  } else {
    return left;
  }
}

function parse_equality_expression(
  tokenizer: Tokenizer,
  expr = new BinaryExpression(null, TokenEnum.EqEq, null)
) {
  const left = parse_relational_expression(tokenizer);
  if (
    tokenizer.nextIfTrue(
      ({ type }) => type === TokenEnum.EqEq || type === TokenEnum.NotEq
    )
  ) {
    expr.left = left;
    expr.right = parse_equality_expression(tokenizer);
    return expr;
  } else {
    return left;
  }
}

function parse_and_expression(
  tokenizer: Tokenizer,
  expr = new BinaryExpression(null, TokenEnum.And, null)
) {
  const left = parse_equality_expression(tokenizer);
  if (tokenizer.nextIfTrue(({ type }) => type === TokenEnum.And)) {
    expr.left = left;
    expr.right = parse_equality_expression(tokenizer);
    return expr;
  } else {
    return left;
  }
}

function parse_or_expression(
  tokenizer: Tokenizer,
  expr = new BinaryExpression(null, TokenEnum.Or, null)
) {
  const left = parse_and_expression(tokenizer);
  if (tokenizer.nextIfTrue(({ type }) => type === TokenEnum.Or)) {
    expr.left = left;
    expr.right = parse_equality_expression(tokenizer);
    return expr;
  } else {
    return left;
  }
}

export function parse_conditional_expression(tokenizer: Tokenizer) {
  const expr = parse_or_expression(tokenizer);
  return expr;
}

export function parse_assignment_expression(tokenizer: Tokenizer) {
  const ident = parse_primary_expression(tokenizer);
  if (ident instanceof GroupExpression || ident instanceof CallExpression)
    throw new Error("Expected identifier");
  if (ident.value.type !== TokenEnum.Identifier)
    throw new Error(
      "Expected identifier but got " + TokenEnum[ident.value.type]
    );
  if (!tokenizer.nextIfTrue(({ type }) => type === TokenEnum.Eq)) {
    throw new Error("Expected ':=' after identifier ");
  }
  const expr = parse_conditional_expression(tokenizer);
  return new BinaryExpression(ident, TokenEnum.Eq, expr);
}

export function parse_expression(tokenizer: Tokenizer): Evaluatable {
  const expression = parse_conditional_expression(tokenizer);

  return expression;
}

export function parse_function_declaration(
  tokenizer: Tokenizer
): FunctionDeclaration {
  const identifier = tokenizer.next();
  if (identifier?.type !== TokenEnum.Identifier)
    throw new Error("Expected name for function declaration");
  const funcDecl = new FunctionDeclaration(identifier.value, []);
  tokenizer.next(); // eat '('
  const params: FuncParameter[] = [];
  while (!tokenizer.nextIfTrue(({ type }) => type === TokenEnum.ParenClose)) {
    const param_type = tokenizer.next();
    const possible_out = tokenizer.next();
    if (possible_out?.type === TokenEnum.Out) {
      const param_name = tokenizer.next();
      params.push(
        new FuncParameter(
          "both",
          new VariableExpression(param_name!.value, true)
        )
      );
    } else {
      const t = param_type!.type === TokenEnum.In ? "in" : "out";

      params.push(
        new FuncParameter(
          t,
          new VariableExpression(possible_out!.value, t == "out" ? true : false)
        )
      );
    }
    const isComma = tokenizer.next();
    if (isComma?.type === TokenEnum.Comma) continue;
    else if (isComma?.type !== TokenEnum.ParenClose)
      throw new Error(tokenizer.errorMessage("Expected ',' or ')'"));
    else break;
  }
  funcDecl.params = params;
  return funcDecl;
}
