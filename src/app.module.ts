import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PixModule } from './pix/pix.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';

const redisConfig = {
  host: process.env.REDIS_HOST as string,
  port: process.env.REDIS_PORT as unknown as number,
};
@Module({
  imports: [
    UserModule,
    PixModule,
    AuthModule,
    ScheduleModule.forRoot(),
    RedisModule.forRoot({
      config: redisConfig,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
