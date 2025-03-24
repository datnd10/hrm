import {
  IsDate,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { BankAccountStatus, OwnerType } from "../../constants/enum";
import { Type } from "class-transformer";

export class CreateBankAccountDto {
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsNumber()
  @IsOptional()
  ownerId?: number;

  @IsEnum(OwnerType)
  @IsNotEmpty()
  ownerType: OwnerType;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  closingDate: Date;

  @IsNumber()
  @IsOptional()
  balance?: number;

  @IsEnum(BankAccountStatus)
  @IsNotEmpty()
  status?: BankAccountStatus;
}
