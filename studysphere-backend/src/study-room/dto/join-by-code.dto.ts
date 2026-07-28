import { IsNotEmpty, IsString, Matches } from "class-validator";

export class JoinByCodeDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{6}$/, { message: 'Davet kodu 6 haneli bir sayı olmalıdır.' })
    code !: string;
}
