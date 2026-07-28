import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

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

    // true ise oda genel listede gizlenir, sadece davet kodu/arkadaş daveti ile
    // bulunabilir — bkz. study-room.entity.ts'teki isPrivate/inviteCode yorumu.
    @IsBoolean()
    @IsOptional()
    isPrivate ?: boolean;
}
