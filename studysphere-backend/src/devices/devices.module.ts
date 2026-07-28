import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnownDevice } from './entities/known-device.entity';
import { DevicesService } from './devices.service';

@Module({
    imports: [TypeOrmModule.forFeature([KnownDevice])],
    providers: [DevicesService],
    exports: [DevicesService],
})
export class DevicesModule { }
