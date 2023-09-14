import { Body, Injectable, } from "@nestjs/common";
import { CreateUserDTO } from "./dto/create-user.dto";
import { strongPasswordGenerator } from "src/utils/strongPasswordGenerator";
import * as bcrypt from 'bcrypt';
import { PrismaService } from "src/prisma/prisma.service";
import { User } from "@prisma/client";


@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async createUser(body: CreateUserDTO): Promise<{ user?: User, err?: any, password?: string }> {
        const { username, name, email } = body;

        //verify if user or email already exists

        const userExists = await this.prisma.user.findUnique({
            where: {
                username
            }
        })

        if (userExists) {
            return { err: { message: "O nome de usuário já está em uso" } };
        }

        const emailExists = await this.prisma.user.findUnique({
            where: {
                email
            }
        })

        if (emailExists) {
            return { err: { message: "O email já está em uso " } };
        }

        const password = strongPasswordGenerator();
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            username,
            name,
            email,
            password: hashedPassword,
            createdAt: new Date(),
        }

        const saveUser = async (): Promise<{ user?: User, err?: any }> => {
            try {
                const user = await this.prisma.user.create({
                    data: newUser
                })
                return { user };
            } catch (err) {
                return { err };
            }
        }
        const saveUserResult = await saveUser();

        if (saveUserResult.err) {
            return { err: saveUserResult.err };
        }
        const user = saveUserResult.user;

        return { user, password };
    }
}