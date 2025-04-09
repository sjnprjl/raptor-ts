import Readline from "readline/promises";
import { stdin, stdout } from "process";
import { SubChart } from "../binary-parser/types";
import { VariableExpression } from "./expression-types";
import { RAP_Any, RAP_Value } from "./dt";

export class Environment {
  private variables: Map<string, RAP_Any> = new Map<string, RAP_Any>();
  private variable_ref: Map<string, boolean> = new Map<string, boolean>();
  // functions
  private static functions: Map<string, Function> = new Map<string, Function>();

  private static subCharts: Map<string, SubChart> = new Map<string, SubChart>();

  private static constants: Map<string, RAP_Value<any>> = new Map<
    string,
    RAP_Value<any>
  >();

  private _parent: Environment | null = null;

  constructor() {}

  setConstant(ident: string, value: RAP_Value<any>) {
    Environment.constants.set(ident, value);
  }

  private getEnvForName(name: string): Environment {
    if (this.variables.has(name)) return this;
    if (!this._parent) return this;
    return this._parent.getEnvForName(name);
  }

  setVariable(name: VariableExpression, value: RAP_Any) {
    const env = this.getEnvForName(name.name);
    if (env.isVariableRef(name.name)) {
      const v = env.getVariable(name.name);
      v.value = value.value;
      v.type = value.type;
      env.variables.set(name.name, v);
      return;
    }
    env.variables.set(name.name, value);
    env.variable_ref.set(name.name, name.ref);
  }
  isVariableRef(name: string): boolean {
    if (this.variable_ref.has(name))
      return this.variable_ref.get(name) as boolean;
    if (!this._parent) return false;
    return this._parent.isVariableRef(name);
  }
  getVariable(name: string): RAP_Any {
    if (this.variables.has(name)) return this.variables.get(name)!;
    if (!this._parent) throw new Error(`variable ${name} not found`);
    return this._parent.getVariable(name);
  }

  getVariableSoft(name: string): RAP_Any | undefined {
    if (this.variables.has(name)) return this.variables.get(name)!;
    if (!this._parent) return undefined;
    return this._parent.getVariableSoft(name);
  }

  setIsVariableRef(name: string | VariableExpression, value: boolean) {
    if (typeof name === "string") this.variable_ref.set(name, value);
    else this.variable_ref.set(name.name, value);
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
