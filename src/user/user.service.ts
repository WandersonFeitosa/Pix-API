import { Body, Injectable } from "@nestjs/common";
import { CreateUserDTO } from "./dto/create-user.dto";
import { strongPasswordGenerator } from "src/utils/strongPasswordGenerator";
import * as bcrypt from 'bcrypt';
import { PrismaService } from "src/prisma/prisma.service";


@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async createUser(body: CreateUserDTO) {
        const { username, name, email } = body;

        const password = strongPasswordGenerator();
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            username,
            name,
            email,
            password: hashedPassword
        }

        try {
            const user = await this.prisma.user.create({
                data: newUser
            })
        } catch (err) {
            return { message: "Erro ao salvo o usuário", err, sucess: false }
        }

        return { message: "Usuário salvo com sucesso", sucess: true, user: { username, password } };
    }
}