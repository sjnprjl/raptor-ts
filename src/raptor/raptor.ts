import { BinaryArray, ObjectString } from "../commonclasses";
import { Int32, SubChart } from "../types";
import { LOG, STOP } from "../utils";
import {
  ASM_Object,
  BaseObject,
  Component,
  Logging_Info,
  OString,
  System_Boolean,
  System_Guid,
  System_Int32,
} from "./assembly";
import stringify from "json-stringify-safe";

export class Raptor {
  private tokens: ASM_Object<BaseObject>[];
  private cursor = 0;

  private serialization_version?: ASM_Object<System_Int32>;
  private master_mode?: ASM_Object<System_Boolean>;
  private sub_charts_count?: ASM_Object<System_Int32>;
  private sub_charts: SubChart[] = [];
  private logging_info?: ASM_Object<Logging_Info>;
  private magic_boolean_at_last?: ASM_Object<System_Boolean>;
  private magic_guid_at_last?: ASM_Object<System_Guid>;

  constructor(tokens: ASM_Object<BaseObject>[]) {
    this.tokens = tokens;
  }

  private readSubChart() {
    // there are optional magic number in the front of the subchart
    // don't really know what that mean
    let magicNumber: ASM_Object<System_Int32> | undefined = undefined;

    if (this.peek().object instanceof System_Int32) {
      magicNumber = this.next();
    }

    const objectString = this.next<ObjectString>();
    const asm = new ASM_Object<OString>();
    asm.object = objectString.object.toOString();
    const subChart = new SubChart(asm, this.next(), magicNumber);
    this.sub_charts.push(subChart);
  }

  private readSubCharts() {
    const count = this.sub_charts_count?.valueOf().valueOf();
    if (count == undefined || count <= 0) {
      throw new Error(`There is no sub-chart in the raptor file.`);
    }
    for (let i = 0; i < count; i++) {
      this.readSubChart();
    }
    for (let i = 0; i < count; i++) {
      const subChart = this.sub_charts[i];
      const component = this.next<Component>();
      subChart.addRootComponent(component);
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

    // again, don't know the meaning of the boolean
    this.magic_boolean_at_last = this.next();

    // and lastly, there is a guid
    this.magic_guid_at_last = this.next();

    // should be eof
    if (this.peek() !== undefined)
      throw new Error("could not parse correctly.");
  }

  interpret() {}

  private next<T extends BaseObject>(): ASM_Object<T> {
    return this.tokens[this.cursor++] as ASM_Object<T>;
  }

  private peek<T extends BaseObject>(): ASM_Object<T> {
    return this.tokens[this.cursor] as ASM_Object<T>;
  }
}
