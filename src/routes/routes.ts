import { Router } from "express";
import cors from "cors";
import { GeneratePayment } from "../controllers/GeneratePayment";

const routes = Router();

routes.use(cors());

routes.get("/payment/:txid", new GeneratePayment().checkPayment);
routes.post("/payment", new GeneratePayment().newPayment);

export default routes;
