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
import { LOG, NOT_IMPLEMENTED, THROW, toUint64, writeToFile } from "./utils";

export class Parser {
  private _data: Uint8Array;
  private _cursor = 0;
  private _expectedBinaryType = BinaryTypeEnum.ObjectUrt;
  private _expectedTypeInformation: any = null;
  private _assemblyTable: Record<number, BinaryAssembly> = {};
  private _headers: SerializedStreamHeader[] = [];
  private _objects: any[] = [];
  private _objectMapIdTable: Record<string, any> = {};
  private _stack: BaseType[] = [];
  constructor(data: Uint8Array) {
    this._data = data;
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

  readTypeInfo(binaryTypeEnum: BinaryTypeEnum) {
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
        return this.readInt32();
      case InternalPrimitiveTypeE.Boolean:
        return this.readByte() == 1;
      case InternalPrimitiveTypeE.Byte:
        return this.readByte();
      case InternalPrimitiveTypeE.Char:
        NOT_IMPLEMENTED("IPTE_Char");
      case InternalPrimitiveTypeE.Double:
        NOT_IMPLEMENTED("IPTE_Double");
      case InternalPrimitiveTypeE.Int16:
        return this.readInt16();
      case InternalPrimitiveTypeE.Int64:
        NOT_IMPLEMENTED("IPTE_Int64");
      case InternalPrimitiveTypeE.SByte:
        NOT_IMPLEMENTED("IPTE_SByte");
      case InternalPrimitiveTypeE.UInt16:
        NOT_IMPLEMENTED("IPTE_Uint16");
      case InternalPrimitiveTypeE.UInt32:
      case InternalPrimitiveTypeE.UInt64:
        NOT_IMPLEMENTED("IPTE_UInt64");
      case InternalPrimitiveTypeE.Decimal:
      case InternalPrimitiveTypeE.TimeSpan:
      case InternalPrimitiveTypeE.DateTime:
        const dateTime = toUint64(this.readInt64());
        const dt = new Date(Number(dateTime / 1000_000n));
        return { _typ: "DateTime", dateTime: dateTime.toString(), dt };
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

    (op as ObjectWithMapTyped).values.push(this._memberPrimitiveUnTyped.value);
  }

  readHeader() {
    const serializedStreamHeader = new SerializedStreamHeader();
    serializedStreamHeader.read(this);
    this._headers.push(serializedStreamHeader);
  }

  readBinaryAssembly(binaryHeaderEnum: BinaryHeaderEnum) {
    if (binaryHeaderEnum === BinaryHeaderEnum.CrossAppDomainAssembly) {
      THROW("CrossAppDomainAssembly: Not Implemented");
    }

    const binaryAssembly = new BinaryAssembly();
    binaryAssembly.read(this);
    this._assemblyTable[binaryAssembly.assemId] = binaryAssembly;
  }

  private _memberReference?: MemberReference;

  readMemberReference() {
    if (!this._memberReference) this._memberReference = new MemberReference();
    this._memberReference.read(this);

    const op = this._stack[this._stack.length - 1];
    (op as ObjectWithMapTyped).values.push(this._memberReference);
  }

  private _objectNull?: ObjectNull;

  readObjectNull(binaryHeaderEnum: BinaryHeaderEnum) {
    if (!this._objectNull) this._objectNull = new ObjectNull();
    this._objectNull.read(this, binaryHeaderEnum);

    const op = this._stack[this._stack.length - 1];

    if (op.objectTypeEnum === InternalObjectTypeE.Object) {
      (op as ObjectWithMapTyped).values.push(this._objectNull);
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

    if (!op) {
      this._objects.push(binaryArray);
    } else {
      (op as ObjectWithMapTyped).values.push(binaryArray);
    }
  }

  readObjectString(binaryHeaderEnum: BinaryHeaderEnum) {
    if (binaryHeaderEnum === BinaryHeaderEnum.CrossAppDomainString) {
      THROW("CrossAppDomainString: Not Implemented");
    }
    const objectString = new ObjectString();
    objectString.read(this);

    const op = this._stack[this._stack.length - 1];
    if (op == null) {
      this._objects.push(objectString);
    } else {
      (op as ObjectWithMapTyped).values.push(objectString);
    }
  }

  readObjectWithMapTyped(binaryHeaderEnum: BinaryHeaderEnum) {
    const objectWithMapTyped = new ObjectWithMapTyped(binaryHeaderEnum);
    objectWithMapTyped.read(this);

    objectWithMapTyped.objectTypeEnum = InternalObjectTypeE.Object;

    this._objectMapIdTable[objectWithMapTyped.objectId] = objectWithMapTyped;
    this._objects.push(objectWithMapTyped);
    this._stack.push(objectWithMapTyped);
  }

  private _binaryObject?: BinaryObject;
  readObject() {
    this._binaryObject ??= new BinaryObject();
    this._binaryObject.read(this);

    const objectMap = this._objectMapIdTable[
      this._binaryObject.mapId
    ] as ObjectWithMapTyped;

    if (!objectMap) THROW("objectMap not found");

    const object = objectMap.copy();
    object.objectTypeEnum = InternalObjectTypeE.Object;
    object.objectId = this._binaryObject.objectId;

    this._stack.push(object);

    let opPeek;

    if ((opPeek = this._stack[this._stack.length - 2])) {
      (opPeek as ObjectWithMapTyped).values.push(object);
    } else {
      this._objects.push(object);
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
    while (this._cursor < this._data.length) {
      this._run();
    }
    LOG(this._assemblyTable);
    LOG(this._headers);

    writeToFile("./logs/objects.json", JSON.stringify(this._objects, null, 2));
  }
}
