import { RAP_Boolean } from "./dt";
import { Environment } from "./environment";
import {
  CallExpression,
  Evaluatable,
  IdentifierExpression,
  LiteralExpression,
  VariableExpression,
} from "./expression-types";
import {
  parseAssignmentExpression,
  parseConditionalExpression,
  parseExpression,
  parseFunctionExpression,
} from "./parser";
import { Tokenizer } from "./tokenizer";

export class RaptorInterpreter {
  /**
   * if -> IF_Control
   * proc -> Oval_Procedure
   * func -> Sub_Chart
   */
  private _blockStack: ("if" | "proc" | "func" | "loop_start" | "loop_body")[] =
    [];

  private _envStack: Environment[] = [];

  private _lastCallExpression?: CallExpression;

  static INTERRUPT_NONE = 0;
  static INTERRUPT_INPUT = 1;
  static INTERRUPT_OUTPUT = 2;

  private _interrupt = RaptorInterpreter.INTERRUPT_NONE;

  private _promptString = "";
  private _interruptVariable!: VariableExpression;

  constructor(private readonly _tokenizer: Tokenizer, env: Environment) {
    this._envStack.push(env);
  }

  peekBlockStack() {
    return this._blockStack[this._blockStack.length - 1];
  }

  get promptString() {
    return this._promptString;
  }

  assignInput(value: LiteralExpression) {
    this.env.setVariable(this._interruptVariable, value.eval(this.env));
  }

  get tokenizer() {
    return this._tokenizer;
  }

  get env() {
    return this._envStack[this._envStack.length - 1];
  }

  evaluateAssignmentExpression(source: string) {
    this.tokenizer.tokenize(source);
    const assignment_expression = parseAssignmentExpression(this.tokenizer);
    assignment_expression.eval(this.env);
  }
  evaluateIfExpression(source: string): boolean {
    this.tokenizer.tokenize(source);
    this._blockStack.push("if");
    const if_expression = parseConditionalExpression(this.tokenizer);
    const cond = if_expression.eval(this.env) as RAP_Boolean;
    return cond.value;
  }

  evaluateLoopCondition(source: string): boolean {
    this.tokenizer.tokenize(source);
    const if_expression = parseConditionalExpression(this.tokenizer);
    const cond = if_expression.eval(this.env) as RAP_Boolean;
    return cond.value;
  }

  pushLoopStartToStack() {
    this._blockStack.push("loop_start");
  }
  pushLoopBodyToStack() {
    this._blockStack.push("loop_body");
  }
  evaluateSubChart() {
    this._blockStack.push("func");
  }
  evaluateProcedure(source: string) {
    this._blockStack.push("proc");
    this.tokenizer.tokenize(source);
    const call_expression = this._lastCallExpression;
    if (!call_expression || !(call_expression instanceof CallExpression))
      throw new Error(
        "Expected call expression. Required for procedure. It shouldn't occur. Possible a bug."
      );
    const function_declaration = parseFunctionExpression(this.tokenizer);
    function_declaration.args = call_expression.args;
    function_declaration.eval(this.env);
  }

  getIdentifierName(identifier: IdentifierExpression) {
    return identifier.value.value;
  }

  evaluateCallExpression(
    source: string
  ): CallExpression | IdentifierExpression {
    this.tokenizer.tokenize(source);

    const expression = parseExpression(this.tokenizer);

    if (expression instanceof CallExpression) {
      const localEnv = new Environment();
      localEnv.setParent(this.env);
      this._envStack.push(localEnv);
      this._lastCallExpression = expression;
    }

    if (
      expression instanceof CallExpression ||
      expression instanceof IdentifierExpression
    )
      return expression;
    throw new Error("Expected call expression or identifier expression");
  }

  evaluateRead(prompt: Evaluatable, variable: VariableExpression) {
    this._interrupt = RaptorInterpreter.INTERRUPT_INPUT;
    this._promptString = "" + prompt.eval(this.env).value;
    this._interruptVariable = variable;
  }
  evaluateWrite(output: Evaluatable) {
    this._interrupt = RaptorInterpreter.INTERRUPT_OUTPUT;
    this._promptString = "" + output.eval(this.env).value.toString();
  }

  popStack() {
    if (this._blockStack.length > 0) {
      const block = this._blockStack.pop();
      if (block === "proc") {
        this._envStack.pop();
      }
    }
  }

  resetInterrupt() {
    this._interrupt = 0;
  }

  get interrupt() {
    return this._interrupt;
  }

  isInterrupted() {
    return this._interrupt !== 0;
  }

  parseExpression(source: string) {
    this.tokenizer.tokenize(source);
    return parseExpression(this.tokenizer);
  }
}
