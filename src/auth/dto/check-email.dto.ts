import { PickType } from "@nestjs/mapped-types";
import { LoginDto } from "./login.dto";

export class CheckEmailDto extends PickType(LoginDto, ["email"]) { }