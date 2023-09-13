import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { PixController } from './pix.controller';
import { PixService } from './pix.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ValidateUserMiddleware } from 'src/middlewares/validate-user.middleware';

@Module({
  imports: [PrismaModule],
  controllers: [PixController],
  providers: [PixService],
  exports: [],
})
export class PixModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ValidateUserMiddleware).forRoutes(PixController);
  }
}
