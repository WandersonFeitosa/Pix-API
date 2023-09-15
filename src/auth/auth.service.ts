import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }
    async generateToken(user: User): Promise<{ access_token?: string, err?: any }> {
        const payload = {
            sub: user.id,
            username: user.username,
            email: user.email,

        };
        const options = {
            expiresIn: "180d",
        };

        const access_token = this.jwtService.sign(payload, options);

        try {
            await this.prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    token: access_token
                }
            })
        }
        catch (err) {
            return { err };
        }
        return { access_token };
    }

    async validateToken(token: string): Promise<{ user?: User, err?: any }> {
        try {
            const payload = this.jwtService.verify(token);
            const user = await this.prisma.user.findUnique({
                where: {
                    id: payload.sub
                }
            });
            if (!user) {
                throw new Error("User not found");
            }
            delete user.password;

            return { user };

        }
        catch (err) {
            return { err };
        }
    }
}