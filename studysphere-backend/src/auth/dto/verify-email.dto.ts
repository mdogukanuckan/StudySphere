import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Kod boş bırakılamaz.' })
  @Matches(/^[0-9]{6}$/, { message: 'Kod 6 haneli rakamlardan oluşmalı.' })
  code!: string;
}
