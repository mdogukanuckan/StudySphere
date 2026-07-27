import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Eski şifre alanı boş bırakılamaz.' })
  oldPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'Yeni şifre alanı boş bırakılamaz.' })
  @MinLength(6, { message: 'Yeni şifre en az 6 karakter olmalıdır.' })
  newPassword!: string;
}