import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateTopicTaskDto {

    @IsString()
    @IsNotEmpty({ message: 'Görev başlığı boş bırakılamaz' })
    @IsOptional()
    title ?: string;

    @IsBoolean()
    @IsOptional()
    isCompleted ?: boolean;

    @IsString()
    @IsOptional()
    notes ?: string;
}
