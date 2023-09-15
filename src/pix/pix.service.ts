import { Injectable, Logger } from '@nestjs/common';
import { CreateBillDTO } from './dto/create-bill.dto';
import { getEfiToken } from 'src/utils/getEfiToken';
import * as https from 'https';
import axios from 'axios';
import * as fs from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';
import { SavePaymentDTO } from './dto/save-payment.dto';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Cron, CronExpression } from '@nestjs/schedule';

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
  ownerId: number;
}
interface GeneratePaymentInterface {
  newBillInfo: CreateBillDTO;
  ownerId: number;
}

@Injectable()
export class PixService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) { }

  async checkPayment(params: { txid: string }) {
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

  async generatePayment({ newBillInfo, ownerId }: GeneratePaymentInterface): Promise<{ newPaymentInfo?: { txid: any, valor: any, location: any }, message?: string, err?: any }> {
    const billData = {
      calendario: {
        expiracao: 3600,
      },
      devedor: {
        cpf: newBillInfo.cpf,
        nome: newBillInfo.name,
      },
      valor: {
        original: newBillInfo.value,
      },
      chave: pixKey,
      solicitacaoPagador: newBillInfo.reason,
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

    const newPaymentData = {
      ...newBillInfo,
      txid,
      value: valor,
      location,
      ownerId,
      createdAt: new Date(),
      status: 'ATIVA',
    };

    const saveRedis = await this.saveRedisData(newPaymentData);

    if (saveRedis.err) return { message: 'Erro ao salvar os dados da cobrança', err: saveRedis.err };

    const newPaymentInfo = {
      txid,
      valor,
      location,
    }
    return { newPaymentInfo };
  }

  async saveRedisData(newPaymentData: SavePaymentDTO): Promise<{ sucess: boolean; err?: any }> {

    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const createdAt = `${day}/${month}/${year}`;

    const jsonList = (await this.redis.get(createdAt)) || '[]';

    const list: TranscationInterface[] = JSON.parse(jsonList);

    list.push(newPaymentData);

    try {
      await this.redis.set(createdAt, JSON.stringify(list));
    } catch (err) {
      return {
        sucess: false,
        err,
      };
    }

    return { sucess: true };
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

  @Cron("0 10 * * * *")
  async upadtePendingPayments() {

    const activePayments = await this.prisma.bill.findMany({
      where: {
        status: 'ATIVA'
      }
    });

    const dateNow = new Date();

    activePayments.forEach(async (payment) => {
      const creationDate = new Date(payment.createdAt);

      const diff = dateNow.getTime() - creationDate.getTime();

      if (diff > 3600000) {
        try {
          await this.updatePayment({ txid: payment.txid, status: 'EXPIRADA' });
        } catch (err) {
          return {
            status: 'EXPIRADA',
            message: 'Erro ao atualizar o status do seu pagamento',
          };
        }
      }
    })

  }
}
