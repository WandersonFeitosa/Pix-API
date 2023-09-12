import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PixModule } from './pix/pix.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';

const redisConfig = {
  host: process.env.REDIS_HOST as string,
  port: process.env.REDIS_PORT as unknown as number,
};
@Module({
  imports: [
    PixModule,
    RedisModule.forRoot({
      config: redisConfig,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
