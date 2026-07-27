import { IsEnum, IsNotEmpty } from "class-validator";
import { ParticipantStatus } from "../enums/participant-status.enum";

export class UpdateParticipantStatusDto {
    @IsEnum(ParticipantStatus)
    @IsNotEmpty()
    status !: ParticipantStatus;
}
