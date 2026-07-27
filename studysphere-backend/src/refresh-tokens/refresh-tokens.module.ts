import { Module } from '@nestjs/common';
import { RefreshTokensService } from './refresh-tokens.service';
import { RefreshTokensController } from './refresh-tokens.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

@Module({
  imports:[TypeOrmModule.forFeature([RefreshToken])],
  controllers: [RefreshTokensController],
  providers: [RefreshTokensService],
  exports : [TypeOrmModule,RefreshTokensService]
})
export class RefreshTokensModule {}
