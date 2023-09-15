import { Controller, Get, Post, Param, Body, UseGuards, Header, Headers } from '@nestjs/common';
import 'dotenv/config';
import { PixService } from './pix.service';
import { CreateBillDTO } from './dto/create-bill.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('pix')
export class PixController {
  constructor(private readonly pixsevice: PixService) { }

  @Get(':txid')
  async checkPayment(@Param() params: { txid: string }) {
    const checkPayment = await this.pixsevice.checkPayment(params);

    return checkPayment;
  }
  @Post()
  async generatePayment(@Body() newBillInfo: CreateBillDTO, @Headers("user") user: any) {

    const payment = await this.pixsevice.generatePayment({ newBillInfo, ownerId: user.id });

    const { errorData } = payment;

    if (errorData) return errorData;

    return { message: 'Pagamento gerado com sucesso', payment };
  }
}
