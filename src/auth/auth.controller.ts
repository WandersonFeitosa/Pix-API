import { Controller, Body, Post, HttpException } from '@nestjs/common';
import { CreateUserDTO } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {

    constructor(private readonly userService: UserService,
        private readonly authService: AuthService
    ) { }

    @Post("createUser")
    async register(@Body() body: CreateUserDTO) {
        const user = await this.userService.createUser(body);

        if (user.err) {
            throw new HttpException(user.err, 500)
        }

        const token = await this.authService.generateToken(user.user);

        if (token.err) {
            throw new HttpException(token.err, 500)
        }

        const access_token = token.access_token;

        const userInfo = {
            username: user.user.username,
            name: user.user.name,
            email: user.user.email,
            password: user.password,
        }

        return { userInfo, access_token };
    }
    @Post("validateUser")
    async validateUser(@Body() body: { token: string }) {
        const token = body.token;

        const user = await this.authService.validateToken(token);

        if (user.err) {
            throw new HttpException(user.err, 500)
        }

        const userInfo = {
            username: user.user.username,
            name: user.user.name,
            email: user.user.email,
        }

        return { userInfo };
    }
}