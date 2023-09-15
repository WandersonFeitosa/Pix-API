import { Controller, Get, Post, Param, Body, UseGuards, Header, Headers } from '@nestjs/common';
import 'dotenv/config';
import { PixService } from './pix.service';
import { CreateBillDTO } from './dto/create-bill.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('pix')
export class PixController {
  constructor(private readonly pixsevice: PixService) { }

  @UseGuards(AuthGuard)
  @Get(':txid')
  async checkPayment(@Param() params: { txid: string }) {
    const checkPayment = await this.pixsevice.checkPayment(params);

    return checkPayment;
  }
  @Post()
  async generatePayment(@Body() { cpf, value, name, reason }: CreateBillDTO) {
    const payment = await this.pixsevice.generatePayment({
      cpf,
      value,
      name,
      reason,
    });

    const { txid, location, errorData } = payment;

    if (errorData) return errorData;

    return { message: 'Pagamento gerado com sucesso', payment };
  }
}
