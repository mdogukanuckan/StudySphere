import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

// CreateTopicTaskDto'nun PartialType'ı DEĞİL: topicId burada bilinçli olarak
// yok — bir görevin bağlı olduğu konu, oluşturulduktan sonra değiştirilemez.
export class UpdateTopicTaskDto {

    @IsString()
    @IsNotEmpty({ message: 'Görev başlığı boş bırakılamaz' })
    @IsOptional()
    title ?: string;

    @IsBoolean()
    @IsOptional()
    isCompleted ?: boolean;

    // Boş string göndermek notu temizlemek için geçerli (IsNotEmpty YOK) —
    // sadece @IsOptional, yani hiç gönderilmezse mevcut not olduğu gibi kalır.
    @IsString()
    @IsOptional()
    notes ?: string;
}
