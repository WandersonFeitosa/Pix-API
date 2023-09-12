import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBillDTO } from './dto/create-bill.dto';
import { getEfiToken } from 'src/utils/getEfiToken';
import * as https from 'https';
import axios from 'axios';
import * as fs from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';
import { SavePaymentDTO } from './dto/save-payment.dto';
import { NotFoundError } from 'rxjs';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

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

interface TranscationInterface {
  name: string;
  cpf: string;
  txid: string;
  value: number;
  reason: string;
  location: string;
  createdAt: Date;
  status: string;
}

@Injectable()
export class PixService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async checkPayment(params: { txid: string }) {
    const list = await this.redis.get('teste');

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

    const response = async () => {
      try {
        const response = await axios(config);
        const { status, calendario, location } = response.data;
        return { status, calendario, location };
      } catch (err) {
        const errorData = err.response.data;
        return { message: 'Erro ao realizar a solicitação', errorData };
      }
    };

    const pixInfo = await response();

    if (pixInfo.errorData) return pixInfo.errorData;

    const { status, calendario, location } = pixInfo;

    if (status == 'ATIVA') {
      const dateNow = new Date();
      const creationDate = new Date(calendario.criacao);

      const diff = dateNow.getTime() - creationDate.getTime();

      if (diff > 3600000) {
        try {
          await this.updatePayment({ txid, status: 'EXPIRADA' });
        } catch (err) {
          return {
            status: 'EXPIRADA',
            message: 'Erro ao atualizar o status do seu pagamento',
          };
        }
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

    const response = async () => {
      try {
        const response = await axios(config);
        return response.data;
      } catch (err) {
        const errorData = err.response.data;
        return { message: 'Erro ao realizar a solicitação', errorData };
      }
    };

    const paymentInfo = await response();

    if (paymentInfo.errorData) return paymentInfo;

    const { txid, valor, location } = paymentInfo;

    this.saveRedisData({
      name,
      cpf,
      txid,
      value,
      reason,
      location,
    });

    return { txid, valor, location };
  }

  async saveRedisData({
    name,
    cpf,
    txid,
    value,
    reason,
    location,
  }: SavePaymentDTO): Promise<{ message: string; sucess: boolean; err?: any }> {
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const createdAt = `${day}/${month}/${year}`;

    const jsonList = (await this.redis.get(createdAt)) || '[]';

    const list: TranscationInterface[] = JSON.parse(jsonList);

    console.log(list.length);

    const formattedValue = Number(value);

    const newPaymentData = {
      name,
      cpf,
      txid,
      value: formattedValue,
      reason,
      location,
      createdAt: date,
      status: 'ATIVA',
    };

    list.push(newPaymentData);

    if (list.length >= 10) {
      await this.prisma.bill.createMany({
        data: list,
      });
      await this.redis.del(createdAt);
      return { message: 'Dados salvos com sucesso', sucess: true };
    }

    try {
      await this.redis.set(createdAt, JSON.stringify(list));
    } catch (err) {
      return {
        message: 'Erro ao salvar os dados no redis',
        sucess: false,
        err,
      };
    }

    return { message: 'Dados salvos com sucesso', sucess: true };
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
