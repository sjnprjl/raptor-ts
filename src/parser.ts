import {
  BaseType,
  BinaryArray,
  BinaryAssembly,
  BinaryObject,
  MemberPrimitiveUnTyped,
  MemberReference,
  ObjectNull,
  ObjectString,
  ObjectWithMapTyped,
  SerializedStreamHeader,
} from "./commonclasses";
import {
  BinaryHeaderEnum,
  BinaryTypeEnum,
  InternalObjectTypeE,
  InternalPrimitiveTypeE,
} from "./enums";
import { ASM_Object, assembly, BaseObject, Ref } from "./raptor/assembly";
import {
  Byte,
  DateTime,
  Decimal,
  Int16,
  Int32,
  Int64,
  InternalPrimitiveType,
  OBoolean,
  SByte,
  TimeSpan,
  UInt16,
  UInt32,
  UInt64,
} from "./types";
import {
  LOG,
  NOT_IMPLEMENTED,
  STOP,
  THROW,
  toUint64,
  writeToFile,
} from "./utils";

import jss from "json-stringify-safe";

export class Parser {
  private _data: Uint8Array;
  private _cursor = 0;
  private _expectedBinaryType = BinaryTypeEnum.ObjectUrt;
  private _expectedTypeInformation: any = null;
  private _assemblyTable: Record<number, BinaryAssembly> = {};
  private _headers: SerializedStreamHeader[] = [];
  private _objects: any[] = [];
  private _objects2: any[] = [];
  private _objectMapIdTable: Record<string, any> = {};
  private _objectMapIdTable2: Record<string, any> = {};
  private _stack: BaseType[] = [];
  private _refTable: Record<string, Ref<BaseObject>> = {};
  private ast: ASM_Object<BaseObject> = new ASM_Object();

  constructor(data: Uint8Array) {
    this._data = data;
  }

  putToObjectMapIdTable2(key: any, data: any) {
    if (key !== data.objectId) {
      LOG(key);
      LOG(data);
      THROW("Not a valid object to put");
    }

    if (this._objectMapIdTable2[key]) {
      console.warn(`key: ${key} is already included in the object map table`);
    }
    this._objectMapIdTable2[key] = data;
  }

  private reset() {
    this._expectedBinaryType = BinaryTypeEnum.ObjectUrt;
    this._expectedTypeInformation = null;
    this._assemblyTable = {};
    this._headers = [];
    this._objects = [];
    this._objectMapIdTable = {};
    this._stack = [];
    // this._refTable = {};
  }

  get cursor() {
    return this._cursor;
  }

  readByte() {
    return this._data[this._cursor++];
  }

  getBytes(n: number) {
    const bytes = this._data.slice(this._cursor, this._cursor + n);
    this._cursor += n;
    return bytes;
  }

  read7BitEncodedString() {
    let count = 0;
    let shift = 0;
    let b;
    do {
      b = this.readByte();
      count |= (b & 0x7f) << shift;
      shift += 7;
    } while ((b & 0x80) != 0);
    return count;
  }

  readString() {
    const length = this.read7BitEncodedString();
    const chars = this.getBytes(length);
    return String.fromCharCode(...chars);
  }

  readInt64() {
    const bytes = this.getBytes(8);
    if (bytes.length !== 8) THROW("Byte array must be 8 bytes long");

    let result = BigInt(0);
    for (let i = 0; i < 8; i++) {
      result |= BigInt(bytes[i]) << BigInt(i * 8); // Little-endian shift
    }

    if (bytes[7] & 0x80) {
      result -= BigInt(1) << BigInt(64);
    }
    return result;
  }

  readInt32() {
    return (
      (this._data[this._cursor++] << 0) |
      (this._data[this._cursor++] << 8) |
      (this._data[this._cursor++] << 16) |
      (this._data[this._cursor++] << 24)
    );
  }

  readInt16() {
    return this.readByte() | (this.readByte() << 8);
  }

  readTypeInfo(binaryTypeEnum: BinaryTypeEnum): [any, number] {
    let typInfo = null;
    let readAssemId = 0;

    switch (binaryTypeEnum) {
      case BinaryTypeEnum.Primitive:
      case BinaryTypeEnum.PrimitiveArray:
        typInfo = this.readByte();
        break;
      case BinaryTypeEnum.String:
      case BinaryTypeEnum.Object:
      case BinaryTypeEnum.StringArray:
      case BinaryTypeEnum.ObjectArray:
        break;
      case BinaryTypeEnum.ObjectUrt:
        typInfo = this.readString();
        break;
      case BinaryTypeEnum.ObjectUser:
        typInfo = this.readString();
        readAssemId = this.readInt32();
        break;
      default:
        THROW("Serialization_TypeRead " + binaryTypeEnum);
    }

    return [typInfo, readAssemId];
  }

  readValue(ipte_code: InternalPrimitiveTypeE) {
    LOG("readValue");
    LOG("ipte_code: ", ipte_code);

    switch (ipte_code) {
      case InternalPrimitiveTypeE.Int32:
        return new Int32(this.readInt32());
      case InternalPrimitiveTypeE.Boolean:
        return new OBoolean(this.readByte() == 1);
      case InternalPrimitiveTypeE.Byte:
        return new Byte(this.readByte());
      case InternalPrimitiveTypeE.Char:
        NOT_IMPLEMENTED("IPTE_Char");
      case InternalPrimitiveTypeE.Double:
        NOT_IMPLEMENTED("IPTE_Double");
      case InternalPrimitiveTypeE.Int16:
        return new Int16(this.readInt16());
      case InternalPrimitiveTypeE.Int64:
        return new Int64(this.readInt64());
      case InternalPrimitiveTypeE.SByte:
        return new SByte(this.readByte());
      case InternalPrimitiveTypeE.UInt16:
        return new UInt16(this.readInt16());
      case InternalPrimitiveTypeE.UInt32:
        return new UInt32(this.readInt32());
      case InternalPrimitiveTypeE.UInt64:
        return new UInt64(this.readInt64());
      case InternalPrimitiveTypeE.Decimal:
        return new Decimal(this.readInt64());
      case InternalPrimitiveTypeE.TimeSpan:
        return new TimeSpan(this.readInt64());
      case InternalPrimitiveTypeE.DateTime:
        const i64 = toUint64(this.readInt64());
        const date = new DateTime(i64);
        return date;
      default:
        THROW("Unimplemented IPTE: " + ipte_code);
    }
  }

  private _memberPrimitiveUnTyped?: MemberPrimitiveUnTyped;
  readMemberPrimitiveUnTyped() {
    LOG("readMemberPrimitiveUnTyped");

    if (this._memberPrimitiveUnTyped)
      this._memberPrimitiveUnTyped.typeInformation =
        this._expectedTypeInformation;
    else
      this._memberPrimitiveUnTyped = new MemberPrimitiveUnTyped(
        this._expectedTypeInformation
      );

    this._memberPrimitiveUnTyped.read(this);

    const op = this._stack[this._stack.length - 1];

    const parent = this._objectMapIdTable2[(op as ObjectWithMapTyped).objectId];
    const key = (op as ObjectWithMapTyped).currentKeyOrIndex;
    if (key === undefined) {
      THROW("key not found");
    }
    if (!parent) {
      LOG(parent);
      LOG(op);
      THROW("parent not found");
    }
    parent[key] = this._memberPrimitiveUnTyped.value;
    (op as ObjectWithMapTyped).add(this._memberPrimitiveUnTyped.value);
  }

  readHeader() {
    const serializedStreamHeader = new SerializedStreamHeader();
    serializedStreamHeader.read(this);
    this.ast.header = serializedStreamHeader;
    this._headers.push(serializedStreamHeader);
  }

  readBinaryAssembly(binaryHeaderEnum: BinaryHeaderEnum) {
    if (binaryHeaderEnum === BinaryHeaderEnum.CrossAppDomainAssembly) {
      THROW("CrossAppDomainAssembly: Not Implemented");
    }

    const binaryAssembly = new BinaryAssembly();
    binaryAssembly.read(this);
    this._assemblyTable[binaryAssembly.assemId] = binaryAssembly;

    // const assemblyNameReg = /([a-zA-Z0-9.]+)\,/.exec(
    //   binaryAssembly.assemblyString
    // );
    // if (!assemblyNameReg)
    //   throw THROW("Error: Could not parse assembly name correctly.");

    // const assemblyName = assemblyNameReg[1];
    // const ass = assembly[assemblyName as keyof typeof assembly];
    // LOG(binaryAssembly.assemblyString);
    // if (!ass) THROW("Assembly: " + assemblyName + " Not Found.");

    // STOP("readBinaryAssembly");
  }

  readMemberReference() {
    const memberReference = new MemberReference();
    memberReference.read(this);

    // const refObj = this._objectMapIdTable[memberReference.idRef];
    // memberReference.ref = refObj;

    const refObj2 = this._objectMapIdTable2[memberReference.idRef];

    const op = this._stack[this._stack.length - 1];

    const parent = this._objectMapIdTable2[(op as ObjectWithMapTyped).objectId];

    const ref = new Ref<BaseObject>(new Int32(memberReference.idRef));

    if (refObj2 && refObj2.objectId !== memberReference.idRef) {
      LOG(refObj2);
      LOG(memberReference);
      THROW("not a valid object referenced");
    }

    if (!refObj2) {
      this._refTable[memberReference.idRef] = ref;
    } else {
      ref.ref = refObj2;
    }

    // if (!refObj2) {
    //   this._refMap[memberReference.idRef] = this._refArr.length;
    //   this._refArr.push(ref);
    // }

    const key = (op as ObjectWithMapTyped).currentKeyOrIndex;
    if (!key) THROW("key not found");
    parent[key] = ref;

    (op as ObjectWithMapTyped).add(memberReference);
  }

  readObjectNull(binaryHeaderEnum: BinaryHeaderEnum) {
    const objectNull = new ObjectNull();
    objectNull.read(this, binaryHeaderEnum);

    const op = this._stack[this._stack.length - 1];

    if (op.objectTypeEnum === InternalObjectTypeE.Object) {
      const parent =
        this._objectMapIdTable2[(op as ObjectWithMapTyped).objectId];
      const key = (op as ObjectWithMapTyped).currentKeyOrIndex;
      if (!key) THROW("key not found");
      parent[key] = objectNull;
      (op as ObjectWithMapTyped).add(objectNull);
    } else {
      THROW("ObjectNull: Not Implemented for " + op.objectTypeEnum);
    }
  }

  readArray(binaryHeaderEnum: BinaryHeaderEnum) {
    LOG("readArray");

    const binaryArray = new BinaryArray(binaryHeaderEnum);
    binaryArray.read(this);
    LOG("binaryArray", binaryArray);
    this._stack.push(binaryArray);

    const op = this._stack[this._stack.length - 2];
    // this._objectMapIdTable2[binaryArray.objectId] = binaryArray;
    this.putToObjectMapIdTable2(binaryArray.objectId, binaryArray);
    this._objectMapIdTable[binaryArray.objectId] = binaryArray;

    if (!op) {
      this._objects.push(binaryArray);
      this._objects2.push(binaryArray);
      this.ast.object = binaryArray;
    } else {
      const parent =
        this._objectMapIdTable2[(op as ObjectWithMapTyped).objectId];
      const key = (op as ObjectWithMapTyped).currentKeyOrIndex;
      if (!key) THROW("Key not found");
      parent[key] = binaryArray;
      (op as ObjectWithMapTyped).add(binaryArray);
    }
  }

  readObjectString(binaryHeaderEnum: BinaryHeaderEnum) {
    if (binaryHeaderEnum === BinaryHeaderEnum.CrossAppDomainString) {
      THROW("CrossAppDomainString: Not Implemented");
    }
    const objectString = new ObjectString();
    objectString.read(this);

    this._objectMapIdTable[objectString.objectId] = objectString;
    this.putToObjectMapIdTable2(objectString.objectId, objectString);

    const op = this._stack[this._stack.length - 1];
    if (op == null) {
      this._objects.push(objectString);
      if (this._refTable[objectString.objectId]) {
        this._refTable[objectString.objectId].ref = objectString;
      } else {
        this.ast.object = objectString;
        this._objects2.push(objectString);
      }
    } else {
      const parent =
        this._objectMapIdTable2[(op as ObjectWithMapTyped).objectId];
      const key = (op as ObjectWithMapTyped).currentKeyOrIndex;
      if (!key) throw THROW("key not found");
      parent[key] = objectString;
      (op as ObjectWithMapTyped).add(objectString);
    }
  }

  private getAssemblyInfo(assemId: number) {
    if (assemId === 0) return assembly["0"];
    const asm = assembly[assemId as keyof typeof assembly];
    if (!asm) throw THROW("Assembly: " + assemId + " Not Found.");
    return asm;
  }

  private getObject(asm: any, name: string): any {
    LOG("getObject", asm, name);
    const obj = name.split(".").reduce((obj, key) => obj[key], asm);
    if (!obj) throw THROW("Object: " + name + " Not Found.");
    return obj;
  }

  readObjectWithMapTyped(binaryHeaderEnum: BinaryHeaderEnum) {
    const objectWithMapTyped = new ObjectWithMapTyped(binaryHeaderEnum);
    objectWithMapTyped.read(this);

    objectWithMapTyped.objectTypeEnum = InternalObjectTypeE.Object;

    this._objectMapIdTable[objectWithMapTyped.objectId] = objectWithMapTyped;

    const asm = this.getAssemblyInfo(objectWithMapTyped.assemId);
    const obj = this.getObject(asm, objectWithMapTyped.name);
    if (!obj) THROW("Object:" + objectWithMapTyped.name + " Not Found.");

    const o = new obj(objectWithMapTyped.objectId);

    this.putToObjectMapIdTable2(objectWithMapTyped.objectId, o);

    this._stack.push(objectWithMapTyped);

    const op = this._stack[this._stack.length - 2];
    if (!op) {
      this._objects.push(objectWithMapTyped);
      if (this._refTable[o.objectId]) {
        this._refTable[o.objectId].ref = o;
      } else {
        this._objects2.push(o);
        this.ast.object = o;
      }
    } else {
      const parentObject =
        this._objectMapIdTable2[(op as ObjectWithMapTyped).objectId];
      if (!parentObject) THROW("parent not found");
      const key = (op as ObjectWithMapTyped).currentKeyOrIndex;

      if (
        key == undefined ||
        key == "undefined" ||
        typeof key == "object" ||
        false
      ) {
        THROW("key is undefined or malformed");
      }
      parentObject[key] = o;
      (op as ObjectWithMapTyped).add(objectWithMapTyped);
    }
  }

  private _binaryObject?: BinaryObject;
  readObject() {
    this._binaryObject ??= new BinaryObject();
    this._binaryObject.read(this);

    const objectMap = this._objectMapIdTable[
      this._binaryObject.mapId
    ] as ObjectWithMapTyped;

    const objectMap2 = this._objectMapIdTable2[this._binaryObject.mapId];

    if (!objectMap) THROW("objectMap not found");
    if (!objectMap2) {
      THROW("objectMap2 not found");
    }

    if (!objectMap2.clone) {
      LOG(objectMap2);
      THROW("objectMap2.clone not found");
    }

    const object = objectMap.copy();
    object.objectTypeEnum = InternalObjectTypeE.Object;
    object.objectId = this._binaryObject.objectId;
    this._objectMapIdTable[object.objectId] = object;

    const n = objectMap2.clone();
    n.objectId = this._binaryObject.objectId;

    this.putToObjectMapIdTable2(n.objectId, n);

    this._stack.push(object);

    let opPeek;

    if ((opPeek = this._stack[this._stack.length - 2])) {
      const parent =
        this._objectMapIdTable2[(opPeek as ObjectWithMapTyped).objectId];
      const key = (opPeek as ObjectWithMapTyped).currentKeyOrIndex;
      if (!key) THROW("key not found");
      parent[key] = this._objectMapIdTable2[object.objectId];
      (opPeek as ObjectWithMapTyped).add(object);
    } else {
      if (this._refTable[n.objectId]) {
        this._refTable[n.objectId].ref = n;
      } else {
        this._objects.push(object);
        this._objects2.push(n);
      }
    }
  }

  _run() {
    this.readHeader();

    let isLoop = true;
    while (isLoop) {
      LOG("parser.expectedType", this._expectedBinaryType);
      let binaryHeaderEnum: BinaryHeaderEnum;

      switch (this._expectedBinaryType) {
        case BinaryTypeEnum.ObjectUrt:
        case BinaryTypeEnum.ObjectUser:
        case BinaryTypeEnum.String:
        case BinaryTypeEnum.Object:
        case BinaryTypeEnum.ObjectArray:
        case BinaryTypeEnum.StringArray:
        case BinaryTypeEnum.PrimitiveArray:
          binaryHeaderEnum = this.readByte();

          LOG(
            "binaryHeaderEnum",
            binaryHeaderEnum,
            "@",
            (this._cursor - 1).toString(16)
          );

          switch (binaryHeaderEnum) {
            case BinaryHeaderEnum.Assembly:
            case BinaryHeaderEnum.CrossAppDomainAssembly:
              this.readBinaryAssembly(binaryHeaderEnum);
              break;
            case BinaryHeaderEnum.Object:
              this.readObject();
              break;
            case BinaryHeaderEnum.CrossAppDomainMap:
              NOT_IMPLEMENTED(binaryHeaderEnum);
              break;
            case BinaryHeaderEnum.ObjectWithMap:
            case BinaryHeaderEnum.ObjectWithMapAssemId:
              //   this.readObjectWithMap(binaryHeaderEnum);
              NOT_IMPLEMENTED(binaryHeaderEnum);
              break;
            case BinaryHeaderEnum.ObjectWithMapTyped:
            case BinaryHeaderEnum.ObjectWithMapTypedAssemId:
              this.readObjectWithMapTyped(binaryHeaderEnum);
              break;
            case BinaryHeaderEnum.MethodCall:
            case BinaryHeaderEnum.MethodReturn:
              NOT_IMPLEMENTED(binaryHeaderEnum);
              break;
            case BinaryHeaderEnum.ObjectString:
            case BinaryHeaderEnum.CrossAppDomainString:
              this.readObjectString(binaryHeaderEnum);
              break;
            case BinaryHeaderEnum.Array:
            case BinaryHeaderEnum.ArraySinglePrimitive:
            case BinaryHeaderEnum.ArraySingleObject:
            case BinaryHeaderEnum.ArraySingleString:
              this.readArray(binaryHeaderEnum);
              break;
            case BinaryHeaderEnum.MemberPrimitiveTyped:
              NOT_IMPLEMENTED(binaryHeaderEnum);
              break;
            case BinaryHeaderEnum.MemberReference:
              this.readMemberReference();
              //   NOT_IMPLEMENTED(binaryHeaderEnum);
              break;
            case BinaryHeaderEnum.ObjectNull:
            case BinaryHeaderEnum.ObjectNullMultiple:
            case BinaryHeaderEnum.ObjectNullMultiple256:
              this.readObjectNull(binaryHeaderEnum);
              //   NOT_IMPLEMENTED(binaryHeaderEnum);
              break;
            case BinaryHeaderEnum.MessageEnd:
              isLoop = false;
              LOG("MessageEnd");
              break;
            default:
              THROW(
                "Serialization_Error: Unknown Header ENum (" +
                  binaryHeaderEnum +
                  " )"
              );
          }
          break;
        case BinaryTypeEnum.Primitive:
          this.readMemberPrimitiveUnTyped();
          break;

        default:
          THROW(
            "Serialization_Error: Unknown Type (" +
              this._expectedBinaryType +
              " )"
          );
      }

      let isData = false;
      while (!isData) {
        if (!this._stack.length) {
          this._expectedBinaryType = BinaryTypeEnum.ObjectUrt;
          isData = true;
        } else {
          const op = this._stack[this._stack.length - 1];
          const { isData: _isData, binaryType, typeInformation } = op.getInfo();

          isData = _isData;
          this._expectedBinaryType = binaryType;
          this._expectedTypeInformation = typeInformation;

          if (!isData) {
            this._stack.pop();
          }
        }
      }
    }
  }

  run() {
    let asts = [];
    while (this._cursor < this._data.length) {
      this._run();
      this._refTable = {};
      this._objectMapIdTable2 = {};
      this._objectMapIdTable = {};
      asts.push(this.ast);
      this.ast = new ASM_Object();
    }
    return asts;
  }
}
