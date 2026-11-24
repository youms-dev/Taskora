import { IntersectionType, OmitType, PickType } from "@nestjs/mapped-types";
import { OAuthLoginDto } from "./oaut-login.dto";
import { RegisterDto } from "./register.dto";

export class OAuthRegisterDto extends IntersectionType(
    OmitType(RegisterDto, ["password"]),
    PickType(OAuthLoginDto, ["provider"]),
) { }