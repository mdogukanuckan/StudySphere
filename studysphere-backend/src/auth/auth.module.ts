import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { RefreshTokensModule } from '../refresh-tokens/refresh-tokens.module';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { MailModule } from '../mail/mail.module';



@Module({
  imports: [UsersModule,
            RefreshTokensModule,
            PassportModule,
            ConfigModule.forRoot(),
            MailModule,
            JwtModule.registerAsync({
              imports: [ConfigModule],
              useFactory: async(configService : ConfigService) => ({
                secret:configService.get<string>('JWT_SECRET'),
                signOptions:{expiresIn:'60m'}
              }),
              inject: [ConfigService]
            }),
  ],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy]
})
export class AuthModule {}