import { ObjectString } from "../commonclasses";
import { Int32, SubChart } from "../types";
import { LOG, STOP } from "../utils";
import { BaseObject, OString, System_Boolean, System_Int32 } from "./assembly";

export class Raptor {
  private tokens: BaseObject[];
  private cursor = 0;

  private serialization_version?: System_Int32;
  private master_mode?: System_Boolean;
  private sub_charts_count?: System_Int32;
  private sub_charts: SubChart[] = [];

  constructor(tokens: BaseObject[]) {
    this.tokens = tokens;
  }

  private readSubChart() {
    // there are optional magic number in the front of the subchart
    // don't really know what that mean
    let magicNumber: System_Int32 | undefined = undefined;

    if (this.peak() instanceof System_Int32) {
      magicNumber = this.next() as System_Int32;
    }

    const objectString = this.next() as ObjectString;
    const o = new OString(objectString.objectId);
    o.value = objectString.valueOf();
    const subChart = new SubChart(o, this.next(), magicNumber);
    this.sub_charts.push(subChart);
  }

  private readSubCharts() {
    const count = this.sub_charts_count?.valueOf();
    if (count == undefined || count <= 0) {
      throw new Error(`There is no sub-chart in the raptor file.`);
    }
    for (let i = 0; i < count; i++) {
      this.readSubChart();
    }
    for (let i = 0; i < count; i++) {
      const subChart = this.sub_charts[i];
      const component = this.peak() as ObjectString;
      LOG(component);
      STOP("readSubCharts");
      //   subChart.addRootComponent(component);
    }
  }

  /**
   * Parse properly to get the sub-charts
   */
  public parse() {
    this.serialization_version = this.next() as System_Int32;
    /** Really don't know if this means master mode or not */
    this.master_mode = this.next();

    /** again, don't know if this means subcharts count or not. */
    this.sub_charts_count = this.next() as System_Int32;

    // read sub-charts
    this.readSubCharts();
  }

  private next() {
    return this.tokens[this.cursor++];
  }

  private peak() {
    return this.tokens[this.cursor];
  }
  private peakPeak() {
    return this.tokens[this.cursor + 1];
  }
}
