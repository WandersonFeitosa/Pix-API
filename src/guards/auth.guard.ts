import { CanActivate, Injectable, ExecutionContext } from "@nestjs/common"
import { AuthService } from "src/auth/auth.service";


@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly authService: AuthService

    ) { }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const { authorization } = request.headers;

        if (!authorization) {
            return false;
        }

        const token = authorization.split(" ")[1];

        const validation = await this.authService.validateToken(token);

        if (validation.err) {
            return false;
        }

        request.headers.user = validation.user;

        return true;
    }
}