import { BinaryArray, ObjectNull, ObjectString } from "../commonclasses";
import { SubChart } from "../types";
import { LOG, STOP, THROW } from "../utils";
import {
  ASM_Object,
  BaseObject,
  Component,
  IF_Control,
  Logging_Info,
  OString,
  Oval,
  Rectangle,
  Ref,
  Subchart_Kinds,
  System_Boolean,
  System_Guid,
  System_Int32,
} from "./assembly";
import { Tokenizer } from "./tokenizer";
import { Environment } from "./environment";

export class Raptor {
  private tokens: ASM_Object<BaseObject>[];
  private cursor = 0;
  private _current_context!: Ref<Component> | ObjectNull | SubChart;

  private serialization_version?: ASM_Object<System_Int32>;
  private master_mode?: ASM_Object<System_Boolean>;
  private sub_charts_count?: ASM_Object<System_Int32>;
  private sub_charts: SubChart[] = [];
  private logging_info?: ASM_Object<Logging_Info>;
  private magic_boolean_at_last?: ASM_Object<System_Boolean>;
  private magic_guid_at_last?: ASM_Object<System_Guid>;
  private _code_tokenizer = new Tokenizer();
  private _stack_frame: Ref<Component>[] = [];

  constructor(
    tokens: ASM_Object<BaseObject>[],
    private readonly env: Environment
  ) {
    this.tokens = tokens;
  }

  private readSubChart() {
    // there are optional magic number in the front of the subchart
    // don't really know what that mean
    let magicNumber: ASM_Object<System_Int32> | undefined = undefined;

    const objectString = this.next<ObjectString>();
    const asm = new ASM_Object<OString>();
    asm.object = objectString.object.toOString();
    const subchart_kind = this.next<Subchart_Kinds>();

    if (this.peek().object instanceof System_Int32) {
      magicNumber = this.next();
    }

    const subChart = new SubChart(asm, subchart_kind, magicNumber);
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
      const component = this.next<Oval>();
      if (!(component.object instanceof Oval)) {
        THROW("component.object instanceof Component == false");
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
  }

  interpret() {
    const mainChart = this.sub_charts[0];
  }

  async step() {
    if (!this._current_context) {
      this._current_context = await this.sub_charts[0].eval(
        this._code_tokenizer,
        this.env
      );
      return true;
    } else {
      if (this._current_context instanceof Ref) {
        let next = await this._current_context
          .valueOf()
          ?.eval(this._code_tokenizer, this.env);
        if (next instanceof ObjectNull) {
          if (this._stack_frame.length > 0) {
            this._current_context = this._stack_frame.pop()!;
            return true;
          }
          return false;
        } else if (this._current_context.valueOf() instanceof IF_Control) {
          this._stack_frame.push(
            this._current_context.valueOf()?._Successor as Ref<Component>
          );
          this._current_context = next!;
          return true;
        } else if (next instanceof SubChart) {
          this._stack_frame.push(
            this._current_context.valueOf()?._Successor as Ref<Component>
          );
          this._current_context = await next.eval(
            this._code_tokenizer,
            this.env
          );
          return true;
        } else if (next?.valueOf() != null) {
          this._current_context = next;
          return true;
        } else if (this._stack_frame.length > 0) {
          this._current_context = this._stack_frame.pop()!;
          return true;
        }
      } else {
        return false;
      }
      return false;
    }
  }

  private next<T extends BaseObject>(): ASM_Object<T> {
    return this.tokens[this.cursor++] as ASM_Object<T>;
  }

  private peek<T extends BaseObject>(): ASM_Object<T> {
    return this.tokens[this.cursor] as ASM_Object<T>;
  }
}
