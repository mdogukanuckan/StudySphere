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

    async registerPushToken(userId: string, deviceId: string, token: string): Promise<void> {
        const result = await this.knownDeviceRepository.update({ userId, deviceId }, { expoPushToken: token });
        if (result.affected) {
            return;
        }

        try {
            const device = this.knownDeviceRepository.create({
                userId,
                deviceId,
                deviceName: null,
                expoPushToken: token,
                lastLoginAt: new Date(),
            });
            await this.knownDeviceRepository.save(device);
        } catch (error) {
            if (!!error && typeof error === 'object' && (error as { code?: string }).code === '23505') {
                await this.knownDeviceRepository.update({ userId, deviceId }, { expoPushToken: token });
                return;
            }
            throw error;
        }
    }

    async getPushTokensForUser(userId: string): Promise<string[]> {
        const devices = await this.knownDeviceRepository.find({
            where: { userId },
            select: { id: true, expoPushToken: true },
        });
        return devices
            .map((device) => device.expoPushToken)
            .filter((token): token is string => !!token);
    }
}
