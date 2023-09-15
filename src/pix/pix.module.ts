import { Module } from '@nestjs/common';
import { PixController } from './pix.controller';
import { PixService } from './pix.service';
import { PrismaModule } from 'src/prisma/prisma.module';

import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PixController],
  providers: [PixService],
  exports: [],
})

export class PixModule { }
