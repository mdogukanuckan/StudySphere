import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { SessionType } from "../entities/study-session.entity";

export class CreateStudySessionDto {
    @IsNotEmpty({ message: 'Konu ID zorunludur.' })
    @IsUUID('4', { message: 'Geçerli bir Konu ID (UUID) formatı girilmelidir.' })
    topicId !: string;

    @IsEnum(SessionType, { message: 'Geçerli bir çalışma türü (POMODORO veya FREE) seçilmelidir.' })
    sessionType !: SessionType;

    @IsOptional()
    @IsString()
    goal ?: string;

    @IsOptional()
    @IsUUID('4', { message: 'Geçerli bir Oda ID (UUID) formatı girilmelidir.' })
    roomId ?: string;

     @IsOptional()
    @IsInt({ message: 'Hedef süre tam sayı (saniye) olmalıdır.' })
    @Min(60, { message: 'Hedef süre en az 1 dakika olmalıdır.' })
    @Max(14400, { message: 'Hedef süre en fazla 4 saat olabilir.' })
    plannedDurationSeconds ?: number;

}
