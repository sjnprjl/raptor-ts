import { Component } from "./component";

export class Comment extends Component {
  private _version: string;
  private _line_no: number;
  private _num_lines: number;
  constructor(
    x_location: number,
    y_location: number,
    num_lines: number,
    version: string,
    line_no: number
  ) {
    super(x_location, y_location);
    this._version = version;
    this._line_no = line_no;
    this._num_lines = num_lines;
  }
}
