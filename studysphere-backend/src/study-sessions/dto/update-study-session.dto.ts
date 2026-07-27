import { PartialType } from '@nestjs/mapped-types';
import { CreateStudySessionDto } from './create-study-session.dto';
import { IsInt, Min ,IsOptional, IsNumber} from 'class-validator';

export class UpdateStudySessionDto extends PartialType(CreateStudySessionDto) {
    @IsOptional()
    @IsInt()
    @Min(0)
    solvedQuestions?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    correctAnswers?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    wrongAnswers?: number;

    @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;
}


