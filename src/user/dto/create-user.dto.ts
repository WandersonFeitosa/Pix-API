import { IsEmail, IsString } from "class-validator";

export class CreateUserDTO {
    @IsString()
    username: string;

    @IsString()
    name: string;

    @IsString()
    @IsEmail()
    email: string;

}