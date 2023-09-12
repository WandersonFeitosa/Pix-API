import { IsNumber, IsString, MinLength } from 'class-validator';

export class CreateBillDTO {
  @IsString()
  @MinLength(11)
  cpf: string;

  @IsString()
  value: number;

  @IsString()
  reason: string;

  @IsString()
  name: string;
}
