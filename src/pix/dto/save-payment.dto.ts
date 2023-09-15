import { IsDate, IsNumber, IsString } from 'class-validator';
import { CreateBillDTO } from './create-bill.dto';

export class SavePaymentDTO extends CreateBillDTO {
  @IsString()
  txid: string;

  @IsString()
  location: string;

  @IsNumber()
  ownerId: number;

  @IsDate()
  createdAt: Date;

  @IsString()
  status: string;
}
