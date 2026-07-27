import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {

    @IsEmail({},{message:'Geçerli bir e-posta adresi giriniz.'})
    @IsNotEmpty({message:'E-posta kısmı boş bırakılamaz.'})
    email !: string;

    @IsString()
    @IsNotEmpty({message :'Kullanıcı adı boş bırakılamaz.'})
    @MinLength(3,{message:'Kullanıcı adı en az 3 karakter olmalı.'})
    @MaxLength(50,{message:'Kullanıcı adı 50 karakterden fazla olamaz.'})
    username !: string;

    @IsString()
    @IsNotEmpty({message:'Şifre alanı boş bırakılamaz.'})
    @MinLength(6,{message:'Şifre en az 6 karakter olmalı'})
    password !: string;

    @IsString()
    @IsOptional()
    firstName !: string;

    @IsString()
    @IsOptional()
    lastName !: string;
}