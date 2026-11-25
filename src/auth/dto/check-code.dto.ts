import { PickType } from "@nestjs/mapped-types";
import { _2FADto } from "./_2fa.dto";

export class CheckCodeDto extends PickType(_2FADto, ["email", "code"]) { }