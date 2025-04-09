import {
  BinaryArray,
  ObjectNull,
  ObjectString,
  ObjectWithMapTyped,
} from "../commonclasses";
import { SubChart } from "../types";
import { LOG, STOP, THROW } from "../utils";
import {
  ASM_Object,
  BaseObject,
  Component,
  IF_Control,
  Logging_Info,
  Loop,
  OString,
  Oval,
  Oval_Procedure,
  Parallelogram,
  Rectangle,
  Ref,
  Subchart_Kinds as Sub_Chart_Kinds,
  System_Boolean,
  System_Guid,
  System_Int32,
} from "./assembly";
import { TokenEnum, Tokenizer } from "./tokenizer";
import { Environment } from "./environment";
import { RaptorInterpreter } from "./interpreter";
import { LiteralExpression } from "./expression-types";
import Readline from "readline";
import { stdin, stdout } from "process";
import { RAP_String } from "./dt";
import { Parser } from "../parser";
import { globalEnv } from "./constant";

export class Raptor {
  private readonly parser: Parser;
  private readonly raptorBinary: Uint8Array;
  private tokens: ASM_Object<BaseObject>[] = [];
  private cursor = 0;
  private _current_context:
    | Oval
    | Oval_Procedure
    | Ref<Component | ObjectNull>
    | ObjectNull
    | SubChart
    | Component
    | undefined;

  private serialization_version?: ASM_Object<System_Int32>;
  private master_mode?: ASM_Object<System_Boolean>;
  private sub_charts_count?: ASM_Object<System_Int32>;
  private sub_charts: SubChart[] = [];
  private logging_info?: ASM_Object<Logging_Info>;
  private magic_boolean_at_last?: ASM_Object<System_Boolean>;
  private magic_guid_at_last?: ASM_Object<System_Guid>;
  private _code_tokenizer = new Tokenizer();
  private _stack_frame: (Ref<Component> | ObjectNull | Component)[] = [];

  private __interpreter = new RaptorInterpreter(this._code_tokenizer, this.env);

  constructor(raptorBinary: Uint8Array, private env: Environment = globalEnv) {
    this.raptorBinary = raptorBinary;
    this.parser = new Parser(this.raptorBinary);
  }

  private readSubChart() {
    // there are optional magic number in the front of the subchart
    // don't really know what that mean
    let magicNumber: ASM_Object<System_Int32> | undefined = undefined;

    const objectString = this.next<ObjectString>();
    const asm = new ASM_Object<OString>();
    asm.object = objectString.object.toOString();
    const sub_chart_kind = this.next<Sub_Chart_Kinds>();

    if (this.peek().object instanceof System_Int32) {
      magicNumber = this.next();
    }

    const subChart = new SubChart(asm, sub_chart_kind, magicNumber);
    this.env.setSubChart(asm.object.value.toLocaleLowerCase(), subChart);
    this.sub_charts.push(subChart);
  }

  private readSubCharts() {
    const count = this.sub_charts_count?.valueOf().valueOf();
    if (count == undefined || count <= 0) {
      throw new Error(`There is no sub-chart in the raptor file.`);
    }
    let i = 0;
    for (i = 0; i < count; i++) {
      this.readSubChart();
    }
    for (i = 0; i < count; i++) {
      const subChart = this.sub_charts[i];
      const component = this.next<Oval | Oval_Procedure>();
      if (
        !(component.object instanceof Oval) &&
        !(component.object instanceof Oval_Procedure)
      ) {
        THROW("Sub Chart top component is not Oval or Oval_Procedure");
      }
      subChart.addRootComponent(component);
      if (!(this.peek().object instanceof BinaryArray)) {
        LOG(this.peek());
        THROW("got unknown type");
      }
      // there is a binary array for some reason.
      // i really don't know the use of that.
      subChart.addMagicArray(this.next());
    }
  }

  /**
   * Parse properly to get the sub-charts
   */
  public parse() {
    this._parse_data();
    this.serialization_version = this.next();
    /** Really don't know if this means master mode or not */
    this.master_mode = this.next();

    /** again, don't know if this means subcharts count or not. */
    this.sub_charts_count = this.next();

    // read sub-charts
    this.readSubCharts();

    // read logging_info
    this.logging_info = this.next();
    if (!(this.logging_info.object instanceof Logging_Info)) {
      THROW("this.logging_info.object instanceof Logging_Info == false");
    }

    // again, don't know the meaning of the boolean
    this.magic_boolean_at_last = this.next();

    // and lastly, there is a guid
    this.magic_guid_at_last = this.next();

    // should be eof
    if (this.peek() !== undefined) {
      throw new Error("could not parse correctly.");
    }
    return this.tokens;
  }

  private _parse_data() {
    const data = this.parser.run();
    this.tokens = data;
  }

  public onInput: (prompt: string) => void = () => {
    throw new Error("onInput is not defined");
  };
  public onOutput?: (outputString: string) => void = () => {
    throw new Error("onOutput is not defined");
  };
  public setInputAnswer(answer: string) {
    const input = new LiteralExpression(new RAP_String(answer));
    this.__interpreter.assign_input(input);
  }
  public startExecution() {
    if (this._interruption) {
      this._interruption = false;
      this.__interpreter.reset_interrupt();
    }
  }

  private _interruption: boolean = false;

  private _done = false;

  public step() {
    if (this._interruption || this._done) return false;

    this._current_context ??= this.sub_charts[0];
    if (this.__interpreter.is_interrupted()) {
      this._interruption = true;
      if (
        this.__interpreter.get_interrupt() ===
        RaptorInterpreter.INTERRUPT_OUTPUT
      ) {
        this.onOutput?.call(this, this.__interpreter.get_promptString());
      } else if (
        this.__interpreter.get_interrupt() === RaptorInterpreter.INTERRUPT_INPUT
      ) {
        this.onInput?.call(this, this.__interpreter.get_promptString());
      }
      return true;
    }

    if (this._current_context instanceof SubChart) {
      const next = this._current_context.next(this.__interpreter);
      this._current_context = next;
    } else if (this._current_context instanceof Oval) {
      this._current_context = this._current_context.next(this.__interpreter);
    } else if (this._current_context instanceof Oval_Procedure) {
      this._current_context = this._current_context.next(this.__interpreter);
    } else if (this._current_context instanceof Ref) {
      const ref = this._current_context.valueOf();
      if (ref instanceof Rectangle && ref.isFunctionCall()) {
        this._current_context = ref.next(this.__interpreter);
        this._stack_frame.push(ref._Successor);
      } else if (ref instanceof IF_Control) {
        this._stack_frame.push(ref._Successor);
        this._current_context = ref.next(this.__interpreter);
      } else if (ref instanceof Loop) {
        this._current_context = ref.next(this.__interpreter);
        if (
          this.__interpreter.peek_block_stack() === "loop_start" ||
          this.__interpreter.peek_block_stack() === "loop_body"
        ) {
          this._stack_frame.push(ref);
        }
      } else this._current_context = ref;
    } else if (this._current_context instanceof Parallelogram) {
      this._current_context = this._current_context.next(this.__interpreter);
    } else if (this._current_context instanceof Rectangle) {
      this._current_context = this._current_context.next(this.__interpreter);
    } else if (this._current_context instanceof Loop) {
      const next = this._current_context.next(this.__interpreter);
      if (
        this.__interpreter.peek_block_stack() === "loop_start" ||
        this.__interpreter.peek_block_stack() === "loop_body"
      ) {
        this._stack_frame.push(this._current_context);
      }
      this._current_context = next;
    } else if (this._current_context instanceof ObjectNull) {
      this._current_context = this._stack_frame.pop();
      if (!this._current_context) this._done = true;
      if (this._current_context instanceof Loop) {
      } else this.__interpreter.__pop_stack();
    } else if (this._current_context instanceof IF_Control) {
      this._current_context = this._current_context.next(this.__interpreter);
    } else if (this._current_context === undefined) {
      this._done = true;
      return false;
    } else {
      LOG(this._current_context);
      throw new Error("unknown type");
    }
    return true;
  }

  interpret() {
    let running = true;
    while (running) {
      running = this.step();
    }
  }

  private next<T extends BaseObject>(): ASM_Object<T> {
    return this.tokens[this.cursor++] as ASM_Object<T>;
  }

  private peek<T extends BaseObject>(): ASM_Object<T> {
    return this.tokens[this.cursor] as ASM_Object<T>;
  }
}
