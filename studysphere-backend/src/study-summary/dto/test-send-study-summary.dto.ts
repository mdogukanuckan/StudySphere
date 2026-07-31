import { IsIn, IsOptional } from 'class-validator';

export class TestSendStudySummaryDto {
    @IsOptional()
    @IsIn(['weekly', 'monthly'])
    period?: 'weekly' | 'monthly';
}
