import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateRoomInviteDto {
    @IsUUID()
    @IsNotEmpty()
    friendUserId !: string;
}
