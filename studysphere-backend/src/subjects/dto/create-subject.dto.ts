import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateSubjectDto {
    @IsString()
    @IsNotEmpty({message : 'Ders adı boş bırakılamaz'})
    name !: string;

    @IsString()
    @IsOptional()
    description !: string;

    @IsUUID('4', {message: 'Geçerli bir evren formatı giriniz'})
    @IsNotEmpty({message : 'Evren seçilmeli'})
    universeId !: string;

    // Sınav/hedef tarihi geri sayımı — opsiyonel. null gönderilirse (ör.
    // düzenleme ekranında tarih temizlenirse) IsOptional bunu da geçerli sayıp
    // atlar, böylece hedef tarih kaldırılabilir.
    @IsDateString({}, { message: 'Geçerli bir tarih giriniz (YYYY-AA-GG)' })
    @IsOptional()
    targetDate ?: string | null;

    @IsString()
    @IsOptional()
    targetLabel ?: string | null;
}
