export function decodeJwtPayload<T = any>(token: string): T | null {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = globalThis.atob(base64);
        return JSON.parse(decoded) as T;
    } catch {
        return null;
    }
}
