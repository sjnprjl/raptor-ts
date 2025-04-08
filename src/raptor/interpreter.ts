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
  parse_assignment_expression,
  parse_conditional_expression,
  parse_expression,
  parse_function_declaration,
} from "./parser";
import { Token, TokenEnum, Tokenizer } from "./tokenizer";

export class InterpreterError extends Error {}

export class RaptorInterpreter {
  /**
   * if -> IF_Control
   * proc -> Oval_Procedure
   * func -> Sub_Chart
   */
  private _block_stack: (
    | "if"
    | "proc"
    | "func"
    | "loop_start"
    | "loop_body"
  )[] = [];

  private _env_stack: Environment[] = [];

  private _last_call_expression?: CallExpression;

  static INTERRUPT_NONE = 0;
  static INTERRUPT_INPUT = 1;
  static INTERRUPT_OUTPUT = 2;

  private _interrupt = RaptorInterpreter.INTERRUPT_NONE;

  private _promptString = "";
  private _interruptVariable!: VariableExpression;

  constructor(private readonly tokenizer: Tokenizer, env: Environment) {
    this._env_stack.push(env);
  }

  peek_block_stack() {
    return this._block_stack[this._block_stack.length - 1];
  }

  get_promptString() {
    return this._promptString;
  }

  assign_input(value: LiteralExpression) {
    this.env.setVariable(this._interruptVariable, value.eval(this.env));
  }

  get _tokenizer() {
    return this.tokenizer;
  }

  get env() {
    return this._env_stack[this._env_stack.length - 1];
  }

  __evaluate_assignment_expression(source: string) {
    this.tokenizer.tokenize(source);
    const assignment_expression = parse_assignment_expression(this.tokenizer);
    assignment_expression.eval(this.env);
  }
  __evaluate_if_expression(source: string): boolean {
    this.tokenizer.tokenize(source);
    this._block_stack.push("if");
    const if_expression = parse_conditional_expression(this.tokenizer);
    const cond = if_expression.eval(this.env) as RAP_Boolean;
    return cond.value;
  }

  __push_loop_start_to_stack() {
    this._block_stack.push("loop_start");
  }
  __push_loop_body_to_stack() {
    this._block_stack.push("loop_body");
  }
  __evaluate_sub_chart() {
    this._block_stack.push("func");
  }
  __evaluate_procedure(source: string) {
    this._block_stack.push("proc");
    this.tokenizer.tokenize(source);
    const call_expression = this._last_call_expression;
    if (!call_expression || !(call_expression instanceof CallExpression))
      throw new Error(
        "Expected call expression. Required for procedure. It shouldn't occur. Possible a bug."
      );
    const function_declaration = parse_function_declaration(this.tokenizer);
    function_declaration.args = call_expression.args;
    function_declaration.eval(this.env);
  }

  __get_identifier_name(identifier: IdentifierExpression) {
    return identifier.value.value;
  }

  __evaluate_call_expression(
    source: string
  ): CallExpression | IdentifierExpression {
    this.tokenizer.tokenize(source);

    const expression = parse_expression(this.tokenizer);

    if (expression instanceof CallExpression) {
      const localEnv = new Environment();
      localEnv.setParent(this.env);
      this._env_stack.push(localEnv);
      this._last_call_expression = expression;
    }

    if (
      expression instanceof CallExpression ||
      expression instanceof IdentifierExpression
    )
      return expression;
    throw new Error("Expected call expression or identifier expression");
  }

  __evaluate_read(prompt: Evaluatable, variable: VariableExpression) {
    this._interrupt = RaptorInterpreter.INTERRUPT_INPUT;
    this._promptString = "" + prompt.eval(this.env).value;
    this._interruptVariable = variable;
  }
  __evaluate_write(output: Evaluatable) {
    this._interrupt = RaptorInterpreter.INTERRUPT_OUTPUT;
    this._promptString = "" + output.eval(this.env).value.toString();
  }

  __pop_stack() {
    if (this._block_stack.length > 0) {
      const block = this._block_stack.pop();
      if (block === "proc") {
        this._env_stack.pop();
      }
    }
  }

  reset_interrupt() {
    this._interrupt = 0;
  }

  get_interrupt() {
    return this._interrupt;
  }

  is_interrupted() {
    return this._interrupt !== 0;
  }

  __parse_expression(source: string) {
    this.tokenizer.tokenize(source);
    return parse_expression(this.tokenizer);
  }
}
