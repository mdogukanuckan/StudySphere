import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class UpdateStudyRoomDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(2)
  @Max(50)
  @IsOptional()
  maxParticipants?: number;
}