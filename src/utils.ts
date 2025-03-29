import * as fs from "fs/promises";
export function LOG(...msg: unknown[]) {
  console.log(...msg);
}

export function THROW<T extends string>(msg: T) {
  throw new Error(msg);
}

export function NOT_IMPLEMENTED<T>(type: T) {
  THROW("NOT Implemented For Type: ( " + type + " )");
}

export function STOP<T>(at: T) {
  THROW("STOPPING AT: " + at);
}

export function toUint16(int16: number) {
  if (int16 < 0) {
    return int16 + 0x10000;
  }
  return int16;
}

export function toUint32(int32: number) {
  if (int32 < 0) {
    return int32 + 0x100000000;
  }
  return int32;
}

export function toUint64(int64: bigint) {
  if (int64 < 0) {
    return int64 + 0x10000000000000000n;
  }
  return int64;
}

export async function writeToFile(fileName: string, json: string) {
  await fs.writeFile(fileName, json);
}
