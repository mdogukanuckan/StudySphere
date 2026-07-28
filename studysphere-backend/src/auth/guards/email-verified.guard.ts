import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) {
      return false;
    }

    const isVerified = await this.usersService.isEmailVerified(userId);
    if (!isVerified) {
      throw new ForbiddenException('Bu işlem için önce e-posta adresinizi doğrulamanız gerekiyor.');
    }
    return true;
  }
}
