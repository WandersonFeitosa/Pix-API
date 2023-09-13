import { NestMiddleware, BadRequestException } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

export class ValidateUserMiddleware implements NestMiddleware {

    async use(req: Request, res: Response, next: NextFunction) {
        const { authorization } = req.headers;

        if (!authorization) throw new BadRequestException("Credenciais não informadas");

        const [type, base64] = authorization.split(" ");
        const [username, password] = Buffer.from(base64, "base64").toString().split(":");

        console.log(username, password);


        next();
    }

}