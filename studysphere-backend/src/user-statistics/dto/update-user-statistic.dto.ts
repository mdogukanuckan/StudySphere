import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateUserStatisticDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  correctQuestions?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  incorrectQuestions?: number;
}