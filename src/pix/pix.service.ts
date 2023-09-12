import { Injectable } from '@nestjs/common';
import { CreateBillDTO } from './dto/create-bill.dto';
import { getEfiToken } from 'src/utils/getEfiToken';
import * as https from 'https';
import axios from 'axios';
import * as fs from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';
import { SavePaymentDTO } from './dto/save-payment.dto';

const certificateFileName = process.env.CERTIFICATE_FILE_NAME as string;
const efiBillNoTxidUrl = process.env.EFI_BILL_NO_TXID_URL as string;
const pixKey = process.env.PIX_KEY as string;

const certificate: any = fs.readFileSync(
  `./src/certificates/${certificateFileName}.p12`,
);
const agent = new https.Agent({
  pfx: certificate,
  passphrase: '',
});

@Injectable()
export class PixService {
  constructor(private readonly prisma: PrismaService) {}

  async checkPayment(params: any) {
    const txid = params.txid;

    const token = await getEfiToken();
    if (!token) return { message: 'Erro ao gerar o token de acesso' };

    var config = {
      method: 'GET',
      url: `${efiBillNoTxidUrl}/${txid}`,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      httpsAgent: agent,
    };

    const response = await axios(config)
      .then(function (response: any) {
        return response.data;
      })
      .catch(function (error: any) {
        const errorData = error.response.data;
        return { message: 'Erro ao realizar a solicitação', errorData };
      });

    if (!response) return 'Erro ao gerar ao checar cobrança';

    const { status, calendario, location } = response;

    if (status == 'ATIVA') {
      const dateNow = new Date();
      const creationDate = new Date(calendario.criacao);

      const diff = dateNow.getTime() - creationDate.getTime();

      if (diff > 3600000) {
        await this.updatePayment({ txid, status: 'EXPIRADA' });
        return { status: 'EXPIRADA' };
      } else {
        return { status, location };
      }
    }

    if (status == 'CONCLUIDA') return { status };
  }

  async generatePayment({ cpf, value, name, reason }: CreateBillDTO) {
    const billData = {
      calendario: {
        expiracao: 3600,
      },
      devedor: {
        cpf: cpf,
        nome: name,
      },
      valor: {
        original: value,
      },
      chave: pixKey,
      solicitacaoPagador: reason,
    };

    const token = await getEfiToken();
    const data = JSON.stringify(billData);

    var config = {
      method: 'POST',
      url: efiBillNoTxidUrl,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      httpsAgent: agent,
      data: data,
    };

    const response = await axios(config)
      .then(function (response: any) {
        return response.data;
      })
      .catch(function (error: any) {
        const errorData = error.response.data;
        return { message: 'Erro ao gerar a cobrança', errorData };
      });

    const { txid, valor, location } = response;

    return { txid, valor, location };
  }

  async savePayment({
    name,
    cpf,
    txid,
    value,
    reason,
    location,
  }: SavePaymentDTO) {
    const createdAt = new Date();

    const formattedValue = Number(value);

    return this.prisma.bill.create({
      data: {
        name,
        cpf,
        txid,
        value: formattedValue,
        reason,
        location,
        createdAt,
        status: 'ATIVA',
      },
      select: {
        id: true,
      },
    });
  }
  async updatePayment({ txid, status }) {
    return this.prisma.bill.update({
      data: {
        status,
      },
      where: {
        txid,
      },
    });
  }
}
