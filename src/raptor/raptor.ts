import {
  BinaryArray,
  ObjectNull,
  ObjectString,
} from "../binary-parser/commonclasses";
import { SubChart } from "../binary-parser/types";
import { LOG, THROW } from "../binary-parser/utils";
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
  Sub_Chart_Kinds,
  System_Boolean,
  System_Guid,
  System_Int32,
} from "./assembly";
import { Tokenizer } from "./tokenizer";
import { Environment } from "./environment";
import { RaptorInterpreter } from "./interpreter";
import { LiteralExpression } from "./expression-types";
import { RAP_String } from "./dt";
import { Parser } from "../binary-parser/parser";
import { globalEnv } from "./constant";

export class Raptor {
  private readonly parser: Parser;
  private readonly raptorBinary: Uint8Array;
  private tokens: ASM_Object<BaseObject>[] = [];
  private cursor = 0;
  private _currentContext:
    | Oval
    | Oval_Procedure
    | Ref<Component | ObjectNull>
    | ObjectNull
    | SubChart
    | Component
    | undefined;

  private _serializationVersion?: ASM_Object<System_Int32>;
  private _masterMode?: ASM_Object<System_Boolean>;
  private subChartsCount?: ASM_Object<System_Int32>;
  private subCharts: SubChart[] = [];
  private _loggingInfo?: ASM_Object<Logging_Info>;
  private _magicBooleanAtLast?: ASM_Object<System_Boolean>;
  private _magicGuidAtLast?: ASM_Object<System_Guid>;
  private _codeTokenizer = new Tokenizer();
  private _stackFrame: (Ref<Component> | ObjectNull | Component)[] = [];

  private _interpreter = new RaptorInterpreter(this._codeTokenizer, this.env);

  constructor(raptorBinary: Uint8Array, private env: Environment = globalEnv) {
    this.raptorBinary = raptorBinary;
    this.parser = new Parser(this.raptorBinary);
  }

  get currentContext() {
    return this._currentContext;
  }

  get magicGuidAtLast() {
    return this._magicGuidAtLast;
  }

  get serializationVersion() {
    return this._serializationVersion;
  }

  get masterMode() {
    return this._masterMode;
  }
  get magicBooleanAtLast() {
    return this._magicBooleanAtLast;
  }

  private readSubChart() {
    // there are optional magic number in the front of the subchart
    // don't really know what that mean
    let magicNumber: ASM_Object<System_Int32> | undefined = undefined;

    const objectString = this.next<ObjectString>();
    const asm = new ASM_Object<OString>();
    asm.object = objectString.object.toOString();
    const subChartKind = this.next<Sub_Chart_Kinds>();

    if (this.peek().object instanceof System_Int32) {
      magicNumber = this.next();
    }

    const subChart = new SubChart(asm, subChartKind, magicNumber);
    this.env.setSubChart(asm.object.value.toLocaleLowerCase(), subChart);
    this.subCharts.push(subChart);
  }

  private readSubCharts() {
    const count = this.subChartsCount?.valueOf().valueOf();
    if (count == undefined || count <= 0) {
      throw new Error(`There is no sub-chart in the raptor file.`);
    }
    let i = 0;
    for (i = 0; i < count; i++) {
      this.readSubChart();
    }
    for (i = 0; i < count; i++) {
      const subChart = this.subCharts[i];
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
    this._parseData();
    this._serializationVersion = this.next();
    /** Really don't know if this means master mode or not */
    this._masterMode = this.next();

    /** again, don't know if this means subcharts count or not. */
    this.subChartsCount = this.next();

    // read sub-charts
    this.readSubCharts();

    // read logging_info
    this._loggingInfo = this.next();
    if (!(this._loggingInfo.object instanceof Logging_Info)) {
      THROW("this.logging_info.object instanceof Logging_Info == false");
    }

    // again, don't know the meaning of the boolean
    this._magicBooleanAtLast = this.next();

    // and lastly, there is a guid
    this._magicGuidAtLast = this.next();

    // should be eof
    if (this.peek() !== undefined) {
      throw new Error("could not parse correctly.");
    }
    return this.subCharts;
  }

  private _parseData() {
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
    this._interpreter.assignInput(input);
  }
  public startExecution() {
    if (this._interruption) {
      this._interruption = false;
      this._interpreter.resetInterrupt();
    }
  }

  private _interruption: boolean = false;

  private _done = false;

  public step() {
    if (this._interruption || this._done) return false;

    this._currentContext ??= this.subCharts[0];
    if (this._interpreter.isInterrupted()) {
      this._interruption = true;
      if (this._interpreter.interrupt === RaptorInterpreter.INTERRUPT_OUTPUT) {
        this.onOutput?.call(this, this._interpreter.promptString);
      } else if (
        this._interpreter.interrupt === RaptorInterpreter.INTERRUPT_INPUT
      ) {
        this.onInput?.call(this, this._interpreter.promptString);
      }
      return true;
    }

    if (this._currentContext instanceof SubChart) {
      const next = this._currentContext.next(this._interpreter);
      this._currentContext = next;
    } else if (this._currentContext instanceof Oval) {
      this._currentContext = this._currentContext.next(this._interpreter);
    } else if (this._currentContext instanceof Oval_Procedure) {
      this._currentContext = this._currentContext.next(this._interpreter);
    } else if (this._currentContext instanceof Ref) {
      const ref = this._currentContext.valueOf();
      if (ref instanceof Rectangle && ref.isFunctionCall()) {
        this._currentContext = ref.next(this._interpreter);
        this._stackFrame.push(ref._Successor);
      } else if (ref instanceof IF_Control) {
        this._stackFrame.push(ref._Successor);
        this._currentContext = ref.next(this._interpreter);
      } else if (ref instanceof Loop) {
        this._currentContext = ref.next(this._interpreter);
        if (
          this._interpreter.peekBlockStack() === "loop_start" ||
          this._interpreter.peekBlockStack() === "loop_body"
        ) {
          this._stackFrame.push(ref);
        }
      } else this._currentContext = ref;
    } else if (this._currentContext instanceof Parallelogram) {
      this._currentContext = this._currentContext.next(this._interpreter);
    } else if (this._currentContext instanceof Rectangle) {
      this._currentContext = this._currentContext.next(this._interpreter);
    } else if (this._currentContext instanceof Loop) {
      const next = this._currentContext.next(this._interpreter);
      if (
        this._interpreter.peekBlockStack() === "loop_start" ||
        this._interpreter.peekBlockStack() === "loop_body"
      ) {
        this._stackFrame.push(this._currentContext);
      }
      this._currentContext = next;
    } else if (this._currentContext instanceof ObjectNull) {
      this._currentContext = this._stackFrame.pop();
      if (!this._currentContext) this._done = true;
      if (this._currentContext instanceof Loop) {
      } else this._interpreter.popStack();
    } else if (this._currentContext instanceof IF_Control) {
      this._currentContext = this._currentContext.next(this._interpreter);
    } else if (this._currentContext === undefined) {
      this._done = true;
      return false;
    } else {
      LOG(this._currentContext);
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
