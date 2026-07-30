import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnownDevice } from './entities/known-device.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';

@Module({
    imports: [TypeOrmModule.forFeature([KnownDevice])],
    controllers: [DevicesController],
    providers: [DevicesService],
    exports: [DevicesService],
})
export class DevicesModule { }
