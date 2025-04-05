import Readline from "readline/promises";
import { stdin, stdout } from "process";
import { SubChart } from "../types";

export class Environment {
  private variables: Map<string, any> = new Map<string, any>();
  // functions
  private functions: Map<string, Function> = new Map<string, Function>();

  private subCharts: Map<string, SubChart> = new Map<string, SubChart>();

  constructor() {}

  setVariable(name: string, value: any) {
    this.variables.set(name, value);
  }
  getVariable(name: string) {
    const v = this.variables.get(name);
    if (v === undefined) throw new Error(`variable ${name} not found`);
    return v;
  }

  getFunction(name: string) {
    return this.functions.get(name);
  }
  setFunction(name: string, fn: Function) {
    this.functions.set(name, fn);
  }
  setSubChart(name: string, subChart: SubChart) {
    this.subCharts.set(name, subChart);
  }
  getSubChart(name: string) {
    return this.subCharts.get(name);
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
