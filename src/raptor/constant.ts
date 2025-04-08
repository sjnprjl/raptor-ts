import { Environment } from "./environment";
import {
  log,
  abs,
  ceiling,
  const_e,
  floor,
  random,
  min,
  max,
  pi,
  sqrt,
  sin,
  arcsin,
  cos,
  arccos,
  tan,
  arctan,
  to_ASCII,
  to_character,
  Length_Of,
  Is_Array,
  Is_Number,
  Is_String,
  Is_2D_Array,
} from "./std-lib";

export const globalEnv = new Environment();

globalEnv.setFunction("abs", abs);
globalEnv.setFunction("ceiling", ceiling);
globalEnv.setFunction("floor", floor);
globalEnv.setFunction("random", random);
globalEnv.setFunction("log", log);
globalEnv.setFunction("max", max);
globalEnv.setFunction("min", min);
globalEnv.setFunction("sqrt", sqrt);

globalEnv.setFunction("sin", sin);
globalEnv.setFunction("arcsin", arcsin);
globalEnv.setFunction("cos", cos);
globalEnv.setFunction("arccos", arccos);
globalEnv.setFunction("tan", tan);
globalEnv.setFunction("arctan", arctan);

globalEnv.setFunction("to_ascii", to_ASCII);
globalEnv.setFunction("to_character", to_character);
globalEnv.setFunction("length_of", Length_Of);

// boolean functions
globalEnv.setFunction("is_array", Is_Array);
globalEnv.setFunction("is_number", Is_Number);
globalEnv.setFunction("is_string", Is_String);
globalEnv.setFunction("is_2d_array", Is_2D_Array);

// constants
globalEnv.setConstant("e", const_e());
globalEnv.setConstant("pi", pi());
