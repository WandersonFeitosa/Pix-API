import https from "https";
import { Request, Response } from "express";
import { getEfiToken } from "../utils/getToken";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";

dotenv.config();

const cetificateFileName = process.env.CERTIFICATE_FILE_NAME || "";
const efiBillNoTxidUrl = process.env.EFI_BILL_NO_TXID_URL || "";

const certificate: any = fs.readFileSync(
  `./src/certificates/${cetificateFileName}.p12`
);
const agent = new https.Agent({
  pfx: certificate,
  passphrase: "",
});

export class GeneratePayment {
  async newPayment(req: Request, res: Response) {
    const { cpf, name, value } = req.body;

    if (!cpf || !name) {
      return res.status(400).json({ message: "Dados inválidos" });
    }

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
      chave: "62743588-2a54-40c2-93b2-8430ce39e3bd",
      solicitacaoPagador: "VIP NCSMP",
    };

    const token = await getEfiToken();
    const data = JSON.stringify(billData);

    var config = {
      method: "POST",
      url: efiBillNoTxidUrl,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      httpsAgent: agent,
      data: data,
    };

    const response = await axios(config)
      .then(function (response: any) {
        return response.data;
      })
      .catch(function (error: any) {
        console.log("Erro ao Gerar o token" + error);
        return null;
      });

    if (!response)
      return res.status(400).json({ message: "Erro ao gerar a cobrança" });

    const { txid, valor, location } = response;

    res.status(200).json({ txid, valor, location });
  }

  async checkPayment(req: Request, res: Response) {
    const { txid } = req.params;

    if (!txid) {
      return res.status(400).json({ message: "Dados inválidos" });
    }

    const token = await getEfiToken();
    var config = {
      method: "GET",
      url: `${efiBillNoTxidUrl}/${txid}`,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      httpsAgent: agent,
    };

    const response = await axios(config)
      .then(function (response: any) {
        return response.data;
      })
      .catch(function (error: any) {
        console.log("Erro ao Gerar o token" + error);
        return null;
      });

    if (!response)
      return res
        .status(400)
        .json({ message: "Erro ao gerar ao checar cobrança" });

    const { status, calendario, location } = response;

    if (status == "ATIVA") {
      const dateNow = new Date();
      const dateCreation = new Date(calendario.criacao);

      const diff = dateNow.getTime() - dateCreation.getTime();

      if (diff > 3600000) {
        return res.status(200).json({ status: "EXPIRADA" });
      } else {
        return res.status(200).json({ status, location });
      }
    }

    if (status == "CONCLUIDA") return res.status(200).json({ status });

    res.status(200).json({ status });
  }
}
