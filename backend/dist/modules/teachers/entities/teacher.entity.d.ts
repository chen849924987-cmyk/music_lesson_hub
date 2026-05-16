import { User } from '../../users/entities/user.entity';
export declare class Teacher {
    id: number;
    userId: number;
    user: User;
    realName: string;
    introduction: string;
    specialties: string;
    avatar: string;
    contactInfo: string;
    paymentAccount: string;
    notificationEnabled: boolean;
    totalEarnings: number;
    withdrawableBalance: number;
    withdrawnAmount: number;
    isVerified: boolean;
    courseCount: number;
    studentCount: number;
    rating: number;
    createdAt: Date;
    updatedAt: Date;
}
