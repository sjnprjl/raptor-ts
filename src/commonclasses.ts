import {
  BinaryArrayTypeEnum,
  BinaryHeaderEnum,
  BinaryTypeEnum,
  InternalObjectTypeE,
  InternalPrimitiveTypeE,
} from "./enums";
import { Parser } from "./parser";
import { THROW } from "./utils";

export interface BaseType {
  objectTypeEnum?: InternalObjectTypeE;
  getInfo(): {
    isData: boolean;
    binaryType: BinaryTypeEnum;
    typeInformation: any;
  };
}

export class SerializedStreamHeader {
  private _binaryHeaderEnum: BinaryHeaderEnum =
    BinaryHeaderEnum.SerializedStreamHeader;
  private _topId: number = 0;
  private _headerId: number = 0;
  private _majorVersion: number = 0;
  private _minorVersion: number = 0;

  get binaryHeaderEnum() {
    return this._binaryHeaderEnum;
  }

  get topId() {
    return this._topId;
  }
  get headerId() {
    return this._headerId;
  }
  get majorVersion() {
    return this._majorVersion;
  }
  get minorVersion() {
    return this._minorVersion;
  }

  read(parser: Parser) {
    this._binaryHeaderEnum = parser.readByte() as BinaryHeaderEnum;
    this._topId = parser.readInt32();
    this._headerId = parser.readInt32();
    this._majorVersion = parser.readInt32();
    this._minorVersion = parser.readInt32();
  }
  write(writer: any) {
    writer.writeByte(this._binaryHeaderEnum);
    writer.writeInt32(this._topId);
    writer.writeInt32(this._headerId);
    writer.writeInt32(this._majorVersion);
    writer.writeInt32(this._minorVersion);
  }
}

export class ObjectWithMapTyped implements BaseType {
  private _binaryHeaderEnum: BinaryHeaderEnum =
    BinaryHeaderEnum.ObjectWithMapTyped;
  private _objectId: number = 0;
  private _name: string = "";
  private _numMembers: number = 0;
  private _memberNames: string[] = [];
  private _binaryTypeEnumA: BinaryTypeEnum[] = [];
  private _typeInformationA: any[] = [];
  private _memberAssemIds: number[] = [];
  private _assemId: number = 0;
  private __index = 0;
  public values: any[] = [];

  public objectTypeEnum: InternalObjectTypeE = InternalObjectTypeE.Object;

  constructor(binaryHeaderEnum: BinaryHeaderEnum) {
    this._binaryHeaderEnum = binaryHeaderEnum;
  }

  set objectId(objectId: number) {
    this._objectId = objectId;
  }
  set name(name: string) {
    this._name = name;
  }
  set numMembers(numMembers: number) {
    this._numMembers = numMembers;
  }
  get numMembers() {
    return this._numMembers;
  }
  set memberNames(memberNames: string[]) {
    this._memberNames = memberNames;
  }
  get memberNames() {
    return this._memberNames;
  }
  set binaryTypeEnumA(binaryTypeEnumA: BinaryTypeEnum[]) {
    this._binaryTypeEnumA = binaryTypeEnumA;
  }
  get binaryTypeEnumA() {
    return this._binaryTypeEnumA;
  }
  set typeInformationA(typeInformationA: any[]) {
    this._typeInformationA = typeInformationA;
  }
  get typeInformationA() {
    return this._typeInformationA;
  }

  set memberAssemIds(memberAssemIds: number[]) {
    this._memberAssemIds = memberAssemIds;
  }

  get memberAssemIds() {
    return this._memberAssemIds;
  }

  get binaryHeaderEnum() {
    return this._binaryHeaderEnum;
  }

  get name() {
    return this._name;
  }

  get objectId() {
    return this._objectId;
  }

  read(parser: Parser) {
    this._objectId = parser.readInt32();
    this._name = parser.readString();
    this._numMembers = parser.readInt32();

    this._memberNames = new Array(this._numMembers);
    this._binaryTypeEnumA = new Array(this._numMembers);
    this._typeInformationA = new Array(this._numMembers);
    this._memberAssemIds = new Array(this._numMembers);
    for (let i = 0; i < this._numMembers; i++) {
      this._memberNames[i] = parser.readString();
    }
    for (let i = 0; i < this._numMembers; i++) {
      this._binaryTypeEnumA[i] = parser.readByte();
    }

    for (let i = 0; i < this._numMembers; i++) {
      const [typInfo, assemId] = parser.readTypeInfo(this._binaryTypeEnumA[i]);
      this._memberAssemIds[i] = this._assemId;

      if (
        this._binaryTypeEnumA[i] != BinaryTypeEnum.ObjectUrt &&
        this._binaryTypeEnumA[i] != BinaryTypeEnum.ObjectUser
      ) {
        this._typeInformationA[i] = typInfo;
      }
    }

    if (this._binaryHeaderEnum == BinaryHeaderEnum.ObjectWithMapTypedAssemId) {
      this._assemId = parser.readInt32();
    }
  }

  getInfo() {
    const binaryType = this._binaryTypeEnumA[this.__index];
    const typeInformation = this._typeInformationA[this.__index];
    const isData = this.__index < this._numMembers;
    this.__index++;
    return { binaryType, typeInformation, isData };
  }

  copy() {
    const copy = new ObjectWithMapTyped(this._binaryHeaderEnum);
    copy.objectTypeEnum = this.objectTypeEnum;
    copy.objectId = this.objectId;
    copy.name = this.name;
    copy.numMembers = this.numMembers;
    copy.memberNames = this.memberNames;
    copy.binaryTypeEnumA = this.binaryTypeEnumA;
    copy.typeInformationA = this.typeInformationA;
    copy.memberAssemIds = this.memberAssemIds;
    return copy;
  }
}

export class MemberPrimitiveUnTyped {
  private _typeInformation: InternalPrimitiveTypeE;
  private _value: any = null;

  get value() {
    return this._value;
  }

  get typeInformation() {
    return this._typeInformation;
  }

  set typeInformation(typeInformation: InternalPrimitiveTypeE) {
    this._typeInformation = typeInformation;
  }

  constructor(typeInformation: InternalPrimitiveTypeE) {
    this._typeInformation = typeInformation;
  }

  read(parser: Parser) {
    this._value = parser.readValue(this._typeInformation);
  }
}

export class ObjectString {
  private _objectId: number = 0;
  private _value: string = "";

  constructor() {}

  read(parser: Parser) {
    this._objectId = parser.readInt32();
    this._value = parser.readString();
  }

  write(writer: any) {
    writer.writeByte(BinaryHeaderEnum.ObjectString);
    writer.writeInt32(this._objectId);
    writer.writeString(this._value);
  }
}

export class BinaryAssembly {
  private _assemId: number = 0;
  private _assemblyString: string = "";

  get assemId() {
    return this._assemId;
  }
  get assemblyString() {
    return this._assemblyString;
  }

  read(parser: Parser) {
    this._assemId = parser.readInt32();
    this._assemblyString = parser.readString();
  }
  write(writer: any) {
    writer.writeByte(BinaryHeaderEnum.Assembly);
    writer.writeInt32(this._assemId);
    writer.writeString(this._assemblyString);
  }
}

export class MemberReference {
  private _idRef: number = 0;

  set idRef(idRef: number) {
    this._idRef = idRef;
  }

  read(parser: Parser) {
    this._idRef = parser.readInt32();
  }
}

export class ObjectNull {
  public nullCount = 0;

  read(parser: Parser, binaryHeaderEnum: BinaryHeaderEnum) {
    switch (binaryHeaderEnum) {
      case BinaryHeaderEnum.ObjectNull:
        this.nullCount = 1;
        break;
      case BinaryHeaderEnum.ObjectNullMultiple256:
        this.nullCount = parser.readByte();
        break;
      case BinaryHeaderEnum.ObjectNullMultiple:
        this.nullCount = parser.readInt32();
        break;
    }
  }
}

export class BinaryObject {
  objectId: number = 0;
  mapId: number = 0;

  read(parser: Parser) {
    this.objectId = parser.readInt32();
    this.mapId = parser.readInt32();
  }
}

export class BinaryArray implements BaseType {
  private _objectId: number = 0;
  private _rank: number = 0;
  private _lengthA: number[] = [];
  private _lowerBoundA: number[] = [];
  private _binaryTypeEnumA: BinaryTypeEnum[] = [];
  private _typeInformationA: any[] = [];
  private _assemId = 0;
  private _binaryHeaderEnum: BinaryHeaderEnum;
  private _typeInformation: InternalPrimitiveTypeE = 0;
  private _binaryArrayTypeEnum: BinaryArrayTypeEnum = 0;
  private _binaryTypeEnum: BinaryTypeEnum = 0;
  public values: any[] = [];
  private __index = 0;

  constructor(binaryHeaderEnum: BinaryHeaderEnum) {
    this._binaryHeaderEnum = binaryHeaderEnum;
  }
  objectTypeEnum?: InternalObjectTypeE | undefined;
  getInfo(): {
    isData: boolean;
    binaryType: BinaryTypeEnum;
    typeInformation: any;
  } {
    const binaryType = this._binaryTypeEnum;
    const typeInformation = this._typeInformation;
    const isData = this.__index < this._lengthA[0]; // TODO: change this
    this.__index++;
    return { binaryType, typeInformation, isData };
  }

  read(parser: Parser) {
    switch (this._binaryHeaderEnum) {
      case BinaryHeaderEnum.ArraySinglePrimitive:
        this._objectId = parser.readInt32();
        this._lengthA = new Array(1);
        this._lengthA[0] = parser.readInt32();
        this._binaryArrayTypeEnum = BinaryArrayTypeEnum.Single;
        this._rank = 1;
        this._lowerBoundA = new Array(this._rank);
        this._binaryTypeEnum = BinaryTypeEnum.Primitive;
        this._typeInformation = parser.readByte();
        break;
      case BinaryHeaderEnum.ArraySingleString:
        this._objectId = parser.readInt32();
        this._lengthA = new Array(1);
        this._lengthA[0] = parser.readInt32();
        this._binaryArrayTypeEnum = BinaryArrayTypeEnum.Single;
        this._rank = 1;
        this._lowerBoundA = new Array(this._rank);
        this._binaryTypeEnum = BinaryTypeEnum.String;
        this._typeInformation = 0;
        break;
      default:
        THROW(
          "Unimplemented binaryHeaderEnum for readArray: " +
            this._binaryHeaderEnum
        );
    }
  }

  copy() {
    const ba = new BinaryArray(this._binaryHeaderEnum);
    ba._assemId = this._assemId;
    ba._binaryTypeEnumA = this._binaryTypeEnumA;
    ba._objectId = this._objectId;
    ba._rank = this._rank;
    ba._lengthA = this._lengthA;
    ba._lowerBoundA = this._lowerBoundA;
    ba._typeInformationA = this._typeInformationA;
    ba._typeInformation = this._typeInformation;
    ba._binaryArrayTypeEnum = this._binaryArrayTypeEnum;
    ba._binaryTypeEnum = this._binaryTypeEnum;

    return ba;
  }
}
