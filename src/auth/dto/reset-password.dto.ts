import { PickType } from "@nestjs/mapped-types";
import { RegisterDto } from "./register.dto";

export class ResetPasswordDto extends PickType(RegisterDto, ["email", "password"]) { }