import { LOG, STOP } from "../utils";

export type Token = {
  type: TokenEnum;
  value: string;
};
export enum TokenEnum {
  Invalid = 0,
  Identifier,
  Number,
  String,

  Comma,

  // boolean
  True,
  False,

  Eq, // :=
  // relational operators
  EqEq, // ==
  NotEq, // !=
  Gt, // >
  GtEq, // >=
  Lt, // <
  LtEq, // <=

  // arithmetic operators
  Mod, // %
  Plus, // +
  Minus, // -
  Mul,
  Div, // /

  // logical operators
  And, // && | and
  Or, // || | or

  Not, // !

  ParenOpen, // (
  ParenClose, // )
  SqrBracketOpen, // [
  SqrBracketClose, // ]
  EOF,
}
export class Tokenizer {
  private _source: string = "";
  private _cursor = 0;

  private is_digit(c: string) {
    return c >= "0" && c <= "9";
  }

  private is_alpha(c: string) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
  }

  private is_ws(c: string) {
    return c === " " || c === "\t" || c === "\n";
  }
  private eat_ws() {
    while (this.is_ws(this._source[this._cursor])) {
      this._cursor++;
    }
  }

  private is_identifier_start(c: string) {
    return this.is_alpha(c) || c === "_";
  }

  private is_identifier_continue(c: string) {
    return this.is_identifier_start(c) || this.is_digit(c);
  }

  private next_char() {
    let c = this._source[this._cursor];
    this._cursor++;
    return c;
  }

  peek_char() {
    return this._source[this._cursor];
  }

  tokenize(source: string) {
    this._source = source;
    this._cursor = 0;
  }

  eat(type: TokenEnum) {
    const act = this.next();
    if (!act) throw new Error(`Expected ${type}, but got nothing.`);
    if (act.type !== type) {
      throw new Error(`Expected ${type}, but got ${act.type}`);
    }
    return act;
  }

  tokens() {
    const tokens = [];
    while (true) {
      const token = this.next();
      if (token?.type === TokenEnum.EOF) break;
      tokens.push(token);
    }
    return tokens;
  }

  hasNext() {
    return this._cursor < this._source.length;
  }

  nextIfTrue(cb: (n: Token) => boolean) {
    let past = this._cursor;
    const n = this.next();
    if (!n) return false;
    if (cb(n)) {
      return n;
    }
    this._cursor = past;
    return false;
  }

  next() {
    this.eat_ws();

    if (this._cursor >= this._source.length) {
      return { type: TokenEnum.EOF, value: "" };
    }

    this.eat_ws();

    if (
      this._source[this._cursor] === "=" &&
      this._source[this._cursor + 1] === "="
    ) {
      this._cursor += 2;
      return {
        type: TokenEnum.EqEq,
        value: "==",
      };
    } else if ("+-*/%<>!,".includes(this._source[this._cursor])) {
      let c = this.next_char();
      switch (c) {
        case ",":
          return { type: TokenEnum.Comma, value: "," };
        case "+":
          return { type: TokenEnum.Plus, value: "+" };
        case "-":
          return { type: TokenEnum.Minus, value: "-" };
        case "*":
          return { type: TokenEnum.Mul, value: "*" };
        case "/":
          return { type: TokenEnum.Div, value: "/" };
        case "%":
          return { type: TokenEnum.Mod, value: "%" };
        case "<": {
          if (this._source[this._cursor] === "=") {
            this._cursor += 1;
            return { type: TokenEnum.LtEq, value: "<=" };
          }
          return { type: TokenEnum.Lt, value: "<" };
        }
        case ">": {
          if (this._source[this._cursor] === "=") {
            this._cursor += 1;
            return { type: TokenEnum.GtEq, value: ">=" };
          }
          return { type: TokenEnum.Gt, value: ">" };
        }
        case "!": {
          if (this._source[this._cursor] === "=") {
            this._cursor += 1;
            return { type: TokenEnum.NotEq, value: "!=" };
          }
          return { type: TokenEnum.Not, value: "!" };
        }
      }
    } else if (this._source[this._cursor] === '"') {
      let str = "";
      this._cursor++; // eat '"'
      while (this._source[this._cursor] !== '"') {
        str += this.next_char();
      }
      this._cursor++;
      return {
        type: TokenEnum.String,
        value: str,
      };
    } else if (this._source[this._cursor] === "[") {
      this.next_char();
      return {
        type: TokenEnum.SqrBracketOpen,
        value: "[",
      };
    } else if (this._source[this._cursor] === "]") {
      this.next_char();
      return {
        type: TokenEnum.SqrBracketClose,
        value: "]",
      };
    } else if (this._source[this._cursor] === "(") {
      this.next_char();
      return {
        type: TokenEnum.ParenOpen,
        value: "(",
      };
    } else if (this._source[this._cursor] === ")") {
      this.next_char();
      return {
        type: TokenEnum.ParenClose,
        value: ")",
      };
    } else if (
      this._source[this._cursor] === ":" &&
      this._source[this._cursor + 1] === "="
    ) {
      this._cursor += 2;
      return {
        type: TokenEnum.Eq,
        value: ":=",
      };
    } else if (this._source[this._cursor] === '"') {
      let str = "";
      this._cursor++;
      while (this._source[this._cursor] !== '"') {
        str += this.next_char();
      }
      this._cursor++;
      return {
        type: TokenEnum.String,
        value: str,
      };
    } else if (this.is_digit(this._source[this._cursor])) {
      let num = this.next_char();
      let is_float = false;
      while (
        this.is_digit(this._source[this._cursor]) ||
        (!is_float && this._source[this._cursor] === ".")
      ) {
        if (this._source[this._cursor] === ".") {
          is_float = true;
        }
        num += this.next_char();
      }
      return {
        type: TokenEnum.Number,
        value: num,
      };
    } else if (this.is_identifier_start(this._source[this._cursor])) {
      let ident = "";
      while (this.is_identifier_continue(this._source[this._cursor])) {
        ident += this.next_char();
      }

      if (ident.toLocaleLowerCase() === "true") {
        return {
          type: TokenEnum.True,
          value: "true",
        };
      } else if (ident.toLocaleLowerCase() === "false") {
        return {
          type: TokenEnum.False,
          value: "false",
        };
      }

      if (ident.length > 0) {
        return {
          type: TokenEnum.Identifier,
          value: ident.toLowerCase(),
        };
      }
    } else {
      let s = "";
      let i = 0;
      while (i++ < this._cursor) {
        s += "-";
      }
      s += "^";
      const errorMessage = `Unknown token: ${this._source[this._cursor]} at
${this._source}
${s}`;
      throw new Error(errorMessage);
    }
  }
}
