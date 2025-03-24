import { PartialType } from "@nestjs/mapped-types";
import { CreateBankAccountDto } from "./create-bank-account.dto";
import { IsInt, IsNumber } from "class-validator";

export class UpdateBankAccountDto extends PartialType(CreateBankAccountDto) {}
