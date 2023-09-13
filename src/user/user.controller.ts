import { Body, Controller, Post } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDTO } from "./dto/create-user.dto";

@Controller('user')
export class UserController {
    constructor(private readonly userservice: UserService) { }

    @Post()
    async createUser(@Body() body: CreateUserDTO) {
        const user = await this.userservice.createUser(body);
        return user;
    }
}