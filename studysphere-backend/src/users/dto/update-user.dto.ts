import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['passwordHash', 'username'] as const),
) {
  @IsBoolean()
  @IsOptional()
  weeklySummaryEmailEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  monthlySummaryEmailEnabled?: boolean;
}
