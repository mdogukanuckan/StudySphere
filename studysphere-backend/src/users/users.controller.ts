import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { Role } from '../enums/role.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() createUserDto: CreateUserDto) {
    if (req.user.role !== Role.Admin) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  // "Arkadaşlarım" ekranındaki çevrimiçi/çevrimdışı durumu için heartbeat —
  // bkz. UsersService.touchLastActiveAt / FriendsService.computePresence.
  // Mobil taraf uygulama ön plandayken periyodik olarak bunu çağırıyor
  // (bkz. hooks/useHeartbeat.ts).
  @UseGuards(JwtAuthGuard)
  @Patch('me/ping')
  async ping(@Req() req) {
    await this.usersService.touchLastActiveAt(req.user.userId);
    return { message: 'ok' };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req) {
    if (req.user.role !== Role.Admin) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    if (req.user.userId !== id && req.user.role !== Role.Admin) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    if (req.user.userId !== id && req.user.role !== Role.Admin) {
      throw new ForbiddenException('Başka bir kullanıcının bilgilerini güncelleyemezsiniz.');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    if (req.user.userId !== id && req.user.role !== Role.Admin) {
      throw new ForbiddenException('Başka bir kullanıcıyı silemezsiniz.');
    }
    return this.usersService.remove(id);
  }
}
