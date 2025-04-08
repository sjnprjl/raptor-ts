import { RAP_Any, RAP_Array, RAP_Boolean, RAP_Number, RAP_String } from "./dt";

// Basic Math Functions
export function abs(x: RAP_Number): RAP_Number {
  return x.getValue() < 0 ? new RAP_Number(-x.getValue()) : x;
}
export function ceiling(x: RAP_Number): RAP_Number {
  return new RAP_Number(Math.ceil(x.getValue()));
}

export function const_e() {
  return new RAP_Number(Math.E);
}

export function floor(x: RAP_Number): RAP_Number {
  return new RAP_Number(Math.floor(x.getValue()));
}

export function log(x: RAP_Number) {
  return new RAP_Number(Math.log(x.getValue()));
}

export function max(x: RAP_Number, y: RAP_Number) {
  return new RAP_Number(Math.max(x.getValue(), y.getValue()));
}

export function min(x: RAP_Number, y: RAP_Number) {
  return new RAP_Number(Math.min(x.getValue(), y.getValue()));
}

export function pi() {
  return new RAP_Number(Math.PI);
}

export function random() {
  return new RAP_Number(Math.random());
}

export function sqrt(x: RAP_Number) {
  return new RAP_Number(Math.sqrt(x.getValue()));
}

// Trig Functions
export function cos(x: RAP_Number) {
  return new RAP_Number(Math.cos(x.getValue()));
}

export function sin(x: RAP_Number) {
  return new RAP_Number(Math.sin(x.getValue()));
}

export function tan(x: RAP_Number) {
  return new RAP_Number(Math.tan(x.getValue()));
}

export function cot(x: RAP_Number) {
  return new RAP_Number(1 / Math.tan(x.getValue()));
}

export function arccos(x: RAP_Number) {
  return new RAP_Number(Math.acos(x.getValue()));
}

export function arcsin(x: RAP_Number) {
  return new RAP_Number(Math.asin(x.getValue()));
}

export function arccot(x: RAP_Number) {
  return new RAP_Number(Math.atan(1 / x.getValue()));
}

export function arctan(x: RAP_Number) {
  return new RAP_Number(Math.atan(x.getValue()));
}

export function to_character(x: RAP_Number) {
  return new RAP_String(String.fromCharCode(x.getValue()));
}

export function to_ASCII(x: RAP_String) {
  return new RAP_Number(x.getValue().charCodeAt(0));
}

export function Length_Of(x: RAP_String) {
  return new RAP_Number(x.getValue().length);
}

// boolean functions
export function Is_Array(x: RAP_Any) {
  if (x instanceof RAP_Array) return new RAP_Boolean(true);
  return new RAP_Boolean(false);
}

export function Is_Number(x: RAP_Any) {
  if (x instanceof RAP_Number) return new RAP_Boolean(true);
  return new RAP_Boolean(false);
}

export function Is_String(x: RAP_Any) {
  if (x instanceof RAP_String) return new RAP_Boolean(true);
  return new RAP_Boolean(false);
}

export function Is_2D_Array(x: RAP_Any) {
  if (x instanceof RAP_Array && x.getValue()[0] instanceof RAP_Array)
    return new RAP_Boolean(true);
  return new RAP_Boolean(false);
}

// Time functions
// TODO

// File reads
// (only) for nodejs env
