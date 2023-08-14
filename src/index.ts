import express from "express";
import routes from "./routes/routes";
import dotenv from "dotenv";
import https from "https";
import fs from "fs";

dotenv.config();

let port = process.env.PORT ? Number(process.env.PORT) : 3333;
let htppsPort = process.env.HTTPS_PORT ? Number(process.env.HTTPS_PORT) : 3334;

const app = express();

app.use(express.json());
app.use(express.static("./public"));
app.use(routes);

function startServer() {
  try {
    app.listen({
      host: "[::1]",
      port,
    });
  } catch (err) {
    console.error(err);
  }
  console.log(`Servidor iniciado em http://localhost:${port}`);
}
startServer();

const key = fs.readFileSync("./src/certificates/private.key");
const cert = fs.readFileSync("./src/certificates/certificate.crt");

const options = {
  key: key,
  cert: cert,
};

https.createServer(options, app).listen(htppsPort);
console.log(`Servidor HTTPS iniciado em https://localhost:${htppsPort}`);
