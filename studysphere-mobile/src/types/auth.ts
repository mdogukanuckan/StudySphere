export interface RegisterRequest{
    username : string;
    email : string;
    password? : string;
    firstName ?: string;
    lastName?: string;
}

export interface LoginRequest{
    email :string;
    password : string;
    deviceId?: string;
    deviceName?: string;
}

export interface AuthResponse {
    access_token?: string;
    refresh_token?: string;
    user?: {
        id : string;
        email : string;
        role: string;
    };
    message?: string;
    id?: string;
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
}
