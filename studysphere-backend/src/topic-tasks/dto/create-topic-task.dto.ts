import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateTopicTaskDto {

    @IsString()
    @IsNotEmpty({ message: 'Görev başlığı boş bırakılamaz' })
    title !: string;

    @IsUUID('4', { message: 'Geçerli bir konu formatı seçiniz' })
    @IsNotEmpty({ message: 'Konu alanı boş bırakılamaz' })
    topicId !: string;

    @IsString()
    @IsOptional()
    notes ?: string;
}
