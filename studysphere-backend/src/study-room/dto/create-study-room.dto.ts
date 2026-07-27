import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateStudyRoomDto {

    @IsString()
    @IsNotEmpty()
    title !: string;

    @IsString()
    @IsOptional()
    description ?: string;

    @IsUUID()
    @IsNotEmpty()
    universeId !: string;

    @IsUUID()
    @IsNotEmpty()
    subjectId !: string;

    @IsUUID()
    @IsOptional()
    topicId ?: string;

    @IsInt()
    @Min(1)
    @Max(50)
    maxParticipants !: number;
}
