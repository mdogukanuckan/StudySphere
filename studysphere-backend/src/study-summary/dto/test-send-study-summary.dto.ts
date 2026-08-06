import { IsIn, IsOptional } from 'class-validator';

export class TestSendStudySummaryDto {
    @IsOptional()
    @IsIn(['weekly', 'monthly', 'cumulative'])
    period?: 'weekly' | 'monthly' | 'cumulative';
}
