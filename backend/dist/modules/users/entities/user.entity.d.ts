import { Role } from '../../../common/constants';
import { Teacher } from '../../teachers/entities/teacher.entity';
export declare class User {
    id: number;
    teacher: Teacher;
    username: string;
    password: string;
    nickname: string;
    role: Role;
    phone: string;
    email: string;
    avatar: string;
    bio: string;
    isActive: boolean;
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
