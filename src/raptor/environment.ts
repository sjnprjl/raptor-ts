import Readline from "readline/promises";
import { stdin, stdout } from "process";
import { SubChart } from "../types";
import { Value, VariableExpression } from "./expression-types";

export class Environment {
  private variables: Map<string, Value> = new Map<string, Value>();
  private variable_ref: Map<string, boolean> = new Map<string, boolean>();
  // functions
  private static functions: Map<string, Function> = new Map<string, Function>();

  private static subCharts: Map<string, SubChart> = new Map<string, SubChart>();

  private _parent: Environment | null = null;

  constructor() {}

  private getEnvForName(name: string): Environment {
    if (this.variables.has(name)) return this;
    if (!this._parent) return this;
    return this._parent.getEnvForName(name);
  }

  setVariable(name: VariableExpression, value: Value) {
    const env = this.getEnvForName(name.name);
    if (env.isVariableRef(name.name)) {
      const v = env.getVariable(name.name);
      v.value = value.value;
      v.type = value.type;
      env.variables.set(name.name, v);
      return;
    }
    this.variables.set(name.name, value);
    this.variable_ref.set(name.name, name.ref);
  }
  isVariableRef(name: string): boolean {
    if (this.variable_ref.has(name))
      return this.variable_ref.get(name) as boolean;
    if (!this._parent) return false;
    return this._parent.isVariableRef(name);
  }
  getVariable(name: string): Value {
    if (this.variables.has(name)) return this.variables.get(name)!;
    if (!this._parent) throw new Error(`variable ${name} not found`);
    return this._parent.getVariable(name);
  }

  getVariableSoft(name: string): Value | undefined {
    if (this.variables.has(name)) return this.variables.get(name)!;
    if (!this._parent) return undefined;
    return this._parent.getVariableSoft(name);
  }

  getFunction(name: string) {
    return Environment.functions.get(name);
  }
  setFunction(name: string, fn: Function) {
    Environment.functions.set(name, fn);
  }
  setSubChart(name: string, subChart: SubChart) {
    Environment.subCharts.set(name, subChart);
  }
  getSubChart(name: string) {
    return Environment.subCharts.get(name);
  }
  setParent(parent: Environment | null) {
    this._parent = parent;
  }
  getParent() {
    return this._parent;
  }
}

export const globalEnv = new Environment();

async function std_prompt(prompt: string) {
  const readline = Readline.createInterface({ input: stdin, output: stdout });
  const answer = await readline.question(prompt);
  readline.close();
  return answer;
}

function intern_is_array(variable: string, env: Environment) {}

function Is_Array(variable: string) {
  return false;
}

globalEnv.setFunction("prompt", std_prompt);
globalEnv.setFunction("is_array", Is_Array);
globalEnv.setFunction("sqrt", (v: number) => {
  const res = Math.sqrt(v);
  return res;
});
