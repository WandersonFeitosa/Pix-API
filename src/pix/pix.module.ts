import { Module } from '@nestjs/common';
import { PixController } from './pix.controller';
import { PixService } from './pix.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PixController],
  providers: [PixService],
  exports: [],
})
export class PixModule {}
