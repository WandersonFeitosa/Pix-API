import { Body, Controller, Post, HttpException } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDTO } from "./dto/create-user.dto";

@Controller('user')
export class UserController {
    constructor(private readonly userservice: UserService) { }

    @Post()
    async createUser(@Body() body: CreateUserDTO) {
        const user = await this.userservice.createUser(body);

        if (user.err) {
            throw new HttpException(user.err, 500)
        }

        return user;
    }
}