import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { RegisterDto, LoginDto, CreateAccountDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from '../../common/constants';
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    private readonly logger;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<Partial<User>>;
    login(loginDto: LoginDto): Promise<{
        user: Partial<User>;
        accessToken: string;
    }>;
    adminLogin(loginDto: LoginDto): Promise<{
        user: Partial<User>;
        accessToken: string;
    }>;
    changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    createAccount(createAccountDto: CreateAccountDto, role: Role): Promise<Partial<User>>;
}
