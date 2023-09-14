import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PixModule } from './pix/pix.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

const redisConfig = {
  host: process.env.REDIS_HOST as string,
  port: process.env.REDIS_PORT as unknown as number,
};
@Module({
  imports: [
    UserModule,
    PixModule,
    AuthModule,
    RedisModule.forRoot({
      config: redisConfig,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
