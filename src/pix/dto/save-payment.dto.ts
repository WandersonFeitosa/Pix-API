import { CreateBillDTO } from './create-bill.dto';

export class SavePaymentDTO extends CreateBillDTO {
  txid: string;
  location: string;
}
