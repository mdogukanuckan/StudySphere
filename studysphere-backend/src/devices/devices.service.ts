import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnownDevice } from './entities/known-device.entity';

export interface DeviceCheckResult {
    isNewDevice: boolean;
}

@Injectable()
export class DevicesService {

    constructor(
        @InjectRepository(KnownDevice)
        private readonly knownDeviceRepository: Repository<KnownDevice>,
    ) { }

    async checkAndRecordDevice(
        userId: string,
        deviceId: string | undefined,
        deviceName: string | undefined,
    ): Promise<DeviceCheckResult> {
        if (!deviceId) {
            return { isNewDevice: false };
        }

        const existing = await this.knownDeviceRepository.findOne({
            where: { userId, deviceId },
        });

        if (existing) {
            await this.knownDeviceRepository.update(existing.id, {
                lastLoginAt: new Date(),
                deviceName: deviceName ?? existing.deviceName,
            });
            return { isNewDevice: false };
        }

        const priorDeviceCount = await this.knownDeviceRepository.count({ where: { userId } });
        const isFirstDeviceEver = priorDeviceCount === 0;

        const newDevice = this.knownDeviceRepository.create({
            userId,
            deviceId,
            deviceName: deviceName ?? null,
            lastLoginAt: new Date(),
        });
        await this.knownDeviceRepository.save(newDevice);

        return { isNewDevice: !isFirstDeviceEver };
    }
}
