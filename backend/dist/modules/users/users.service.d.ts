import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    findById(id: number): Promise<User>;
    update(userId: number, updateUserDto: UpdateUserDto): Promise<User>;
    findAll(page?: number, pageSize?: number, role?: string, keyword?: string): Promise<{
        items: User[];
        total: number;
    }>;
    toggleActive(userId: number): Promise<User>;
    remove(userId: number): Promise<void>;
}
