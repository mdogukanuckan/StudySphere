import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';

const DEVICE_ID_KEY = 'studysphere_device_id';

function generateDeviceId(): string {
    const random = Math.random().toString(36).slice(2);
    const timestamp = Date.now().toString(36);
    return `${timestamp}-${random}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
    try {
        const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
        if (existing) {
            return existing;
        }
        const newId = generateDeviceId();
        await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
        return newId;
    } catch {
        return generateDeviceId();
    }
}

export function getReadableDeviceName(): string {
    return Device.deviceName ?? Device.modelName ?? Device.osName ?? 'Bilinmeyen cihaz';
}
