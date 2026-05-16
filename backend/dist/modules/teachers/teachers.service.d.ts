import { Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
export declare class TeachersService {
    private readonly teacherRepository;
    constructor(teacherRepository: Repository<Teacher>);
    create(userId: number, realName: string): Promise<Teacher>;
    findByUserId(userId: number): Promise<Teacher>;
    update(userId: number, updateTeacherDto: UpdateTeacherDto): Promise<Teacher>;
    findAll(page?: number, pageSize?: number): Promise<{
        items: Teacher[];
        total: number;
    }>;
    findById(teacherId: number): Promise<Teacher>;
    verifyTeacher(teacherId: number): Promise<Teacher>;
    unverifyTeacher(teacherId: number): Promise<Teacher>;
}
