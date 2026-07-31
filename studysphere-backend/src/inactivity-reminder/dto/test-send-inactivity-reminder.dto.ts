import { IsIn, IsOptional } from 'class-validator';

export class TestSendInactivityReminderDto {
    @IsOptional()
    @IsIn([1, 2, 3])
    stage?: number;
}
