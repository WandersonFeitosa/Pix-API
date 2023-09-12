import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import 'dotenv/config';
import { PixService } from './pix.service';
import { CreateBillDTO } from './dto/create-bill.dto';

@Controller('pix')
export class PixController {
  constructor(private readonly pixsevice: PixService) {}
  @Get(':txid')
  async checkPayment(@Param() params) {
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