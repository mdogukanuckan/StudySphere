export interface CurrentUser {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    experienceMode?: string;
    role?: string;
    isEmailVerified?: boolean;
    weeklySummaryEmailEnabled?: boolean;
    monthlySummaryEmailEnabled?: boolean;
    inactivityReminderEnabled?: boolean;
}


export interface UpdateProfileRequest {
    email?: string;
    firstName?: string;
    lastName?: string;
    weeklySummaryEmailEnabled?: boolean;
    monthlySummaryEmailEnabled?: boolean;
    inactivityReminderEnabled?: boolean;
}
