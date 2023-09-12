import * as https from 'https';
import axios from 'axios';
import * as fs from 'fs';
import 'dotenv/config';

const certificateFileName = process.env.CERTIFICATE_FILE_NAME || '';

const certificate: any = fs.readFileSync(
  `./src/certificates/${certificateFileName}.p12`,
);

var credenciais = {
  client_id: process.env.EFI_CLIENT_ID,
  client_secret: process.env.EFI_CLIENT_SECRET,
};

var data = JSON.stringify({ grant_type: 'client_credentials' });
var data_credentials = credenciais.client_id + ':' + credenciais.client_secret;

var auth = Buffer.from(data_credentials).toString('base64');

const agent = new https.Agent({
  pfx: certificate,
  passphrase: '',
});

const url = process.env.EFI_TOKEN_URL || '';

var config = {
  method: 'POST',
  url: url,
  headers: {
    Authorization: 'Basic ' + auth,
    'Content-Type': 'application/json',
  },
  httpsAgent: agent,
  data: data,
};

export const getEfiToken = async () => {
  const acessToken = await axios(config)
    .then(function (response: any) {
      return response.data;
    })
    .catch(function (error: any) {
      console.log('Erro ao Gerar o token' + error);
      return null;
    });
  if (!acessToken) return null;
  return acessToken.access_token;
};
