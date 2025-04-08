import { RAP_Boolean, RAP_Number, RAP_String } from "./dt";
import {
  BinaryExpression,
  CallExpression,
  Evaluatable,
  FunctionDeclaration,
  FuncParameter,
  GroupExpression,
  LiteralExpression,
  UnaryExpression,
  VariableExpression,
  ArrayExpression,
  MemberExpression,
  IdentifierExpression,
  AssignmentExpression,
  CalleeExpression,
} from "./expression-types";
import { Token, TokenEnum, Tokenizer } from "./tokenizer";

export function parse_group_expr(tokenizer: Tokenizer) {
  const expression = parse_expression(tokenizer);
  if (!tokenizer.nextIfTrue(({ type }) => type === TokenEnum.ParenClose)) {
    throw new Error("Expected ')' but got " + tokenizer.next()?.value);
  }
  return new GroupExpression(expression);
}

export function parse_array_expr(tokenizer: Tokenizer) {
  const array = new ArrayExpression([]);
  while (
    !tokenizer.nextIfTrue(({ type }) => type === TokenEnum.SqrBracketClose)
  ) {
    const expression = parse_expression(tokenizer);
    array.elements.push(expression);
    if (tokenizer.nextIfTrue(({ type }) => type === TokenEnum.Comma)) {
      continue;
    } else if (
      tokenizer.nextIfTrue(({ type }) => type === TokenEnum.SqrBracketClose)
    ) {
      break;
    } else {
      throw new Error(tokenizer.errorMessage("Expected ',' or ']'"));
    }
  }
  return array;
}

export function parse_primary_expression(
  tokenizer: Tokenizer
):
  | GroupExpression
  | ArrayExpression
  | IdentifierExpression
  | LiteralExpression {
  const token = tokenizer.next();
  if (!token) throw new Error("Expected expression");

  switch (token.type) {
    case TokenEnum.ParenOpen:
      return parse_group_expr(tokenizer);
    case TokenEnum.SqrBracketOpen:
      return parse_array_expr(tokenizer);
    case TokenEnum.Identifier:
      return new IdentifierExpression(token);
    case TokenEnum.String:
      return new LiteralExpression(new RAP_String(token.value));
    case TokenEnum.Number:
      return new LiteralExpression(new RAP_Number(+token.value));
    case TokenEnum.True:
      return new LiteralExpression(new RAP_Boolean(true));
    case TokenEnum.False:
      return new LiteralExpression(new RAP_Boolean(false));
    default:
      throw new Error(tokenizer.errorMessage("Expected identifier"));
  }
}

function parse_call_expression(
  tokenizer: Tokenizer
): ReturnType<typeof parse_primary_expression> | CallExpression {
  const primary = parse_primary_expression(tokenizer);
  if (!tokenizer.check(TokenEnum.ParenOpen)) return primary;

  // call expression
  const call_expr = new CallExpression(new CalleeExpression(primary));
  if (tokenizer.nextIfTrue(({ type }) => type === TokenEnum.ParenClose))
    return call_expr;
  call_expr.args.push(parse_expression(tokenizer));
  while (tokenizer.nextIfTrue(({ type }) => type === TokenEnum.Comma)) {
    if (tokenizer.nextIfTrue(({ type }) => type === TokenEnum.ParenClose))
      break;
    call_expr.args.push(parse_expression(tokenizer));
  }
  tokenizer.next(); // eat ')
  return call_expr;
}

function parse_member_expression(tokenizer: Tokenizer) {
  // <ident> '[' ']'
  const call_expr = parse_call_expression(tokenizer);
  if (tokenizer.check(TokenEnum.SqrBracketOpen)) {
    // member_expression
    const arr_expr = parse_array_expr(tokenizer);
    return new MemberExpression(call_expr, arr_expr);
  } else return call_expr;
}

function parse_unary_expression(
  tokenizer: Tokenizer
): ReturnType<typeof parse_member_expression> | UnaryExpression {
  const unary_operator = tokenizer.nextIfTrue(({ type }) =>
    [TokenEnum.Not, TokenEnum.Plus, TokenEnum.Minus].some((t) => t === type)
  );

  if (unary_operator === false) {
    return parse_member_expression(tokenizer);
  } else {
    return new UnaryExpression(
      unary_operator.type,
      parse_unary_expression(tokenizer)
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
      ({ type }) =>
        type === TokenEnum.Mul ||
        type === TokenEnum.Div ||
        type === TokenEnum.Mod
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
  let op: Token | false;
  if (
    (op = tokenizer.nextIfTrue(
      ({ type }) => type === TokenEnum.EqEq || type === TokenEnum.NotEq
    ))
  ) {
    expr.left = left;
    expr.op = op.type;
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
  const ident = parse_member_expression(tokenizer);
  if (
    !(
      ident instanceof IdentifierExpression || ident instanceof MemberExpression
    )
  )
    throw new Error(
      tokenizer.errorMessage(
        "Left hand side must be a identifier or member expression (ex: foo[0])"
      )
    );
  if (!tokenizer.nextIfTrue(({ type }) => type === TokenEnum.Eq)) {
    throw new Error(tokenizer.errorMessage("Expected ':=' after identifier "));
  }
  const expr = parse_conditional_expression(tokenizer);
  return new AssignmentExpression(ident, expr);
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
