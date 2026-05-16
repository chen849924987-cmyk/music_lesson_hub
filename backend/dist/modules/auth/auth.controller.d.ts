import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, CreateAccountDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiResponse } from '../../common/dto/response.dto';
import { User } from '../users/entities/user.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<ApiResponse<Partial<User>>>;
    login(loginDto: LoginDto): Promise<ApiResponse<{
        user: Partial<User>;
        accessToken: string;
    }>>;
    adminLogin(loginDto: LoginDto): Promise<ApiResponse<{
        user: Partial<User>;
        accessToken: string;
    }>>;
    createTeacher(createAccountDto: CreateAccountDto): Promise<ApiResponse<Partial<User>>>;
    createReviewer(createAccountDto: CreateAccountDto): Promise<ApiResponse<Partial<User>>>;
    changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<ApiResponse<{
        message: string;
    }>>;
    createOperator(createAccountDto: CreateAccountDto): Promise<ApiResponse<Partial<User>>>;
}
