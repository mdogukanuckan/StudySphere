
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateUserStatisticDto {
  @IsUUID()
  @IsNotEmpty()
  userId !: string;
}
