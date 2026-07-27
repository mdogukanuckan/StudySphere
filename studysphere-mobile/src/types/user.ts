export interface CurrentUser {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    experienceMode?: string;
    role?: string;
    isEmailVerified?: boolean;
}


export interface UpdateProfileRequest {
    email?: string;
    firstName?: string;
    lastName?: string;
}
