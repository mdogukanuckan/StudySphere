import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { RoomStatus } from '../enums/room-status.enum';

export class RoomFilterDto {
  @IsUUID()
  @IsOptional()
  universe_id?: string;

  @IsUUID()
  @IsOptional()
  subject_id?: string;

  @IsUUID()
  @IsOptional()
  topic_id?: string;

  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;
}