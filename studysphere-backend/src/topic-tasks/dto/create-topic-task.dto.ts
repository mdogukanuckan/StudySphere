import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateTopicTaskDto {

    @IsString()
    @IsNotEmpty({ message: 'Görev başlığı boş bırakılamaz' })
    title !: string;

    @IsUUID('4', { message: 'Geçerli bir konu formatı seçiniz' })
    @IsNotEmpty({ message: 'Konu alanı boş bırakılamaz' })
    topicId !: string;

    // Göreve özel not — opsiyonel, oluşturma anında ya da sonradan (bkz.
    // UpdateTopicTaskDto) eklenebilir.
    @IsString()
    @IsOptional()
    notes ?: string;
}
