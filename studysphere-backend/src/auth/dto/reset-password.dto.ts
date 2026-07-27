import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  @IsNotEmpty({ message: 'E-posta boş bırakılamaz.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Kod boş bırakılamaz.' })
  @Matches(/^[0-9]{6}$/, { message: 'Kod 6 haneli rakamlardan oluşmalı.' })
  code!: string;

  @IsString()
  @IsNotEmpty({ message: 'Yeni şifre boş bırakılamaz.' })
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalı.' })
  newPassword!: string;
}
