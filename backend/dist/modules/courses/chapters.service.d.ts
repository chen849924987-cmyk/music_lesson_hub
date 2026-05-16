import { Repository } from 'typeorm';
import { Chapter } from './entities/chapter.entity';
import { Course } from './entities/course.entity';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
export declare class ChaptersService {
    private readonly chapterRepository;
    private readonly courseRepository;
    constructor(chapterRepository: Repository<Chapter>, courseRepository: Repository<Course>);
    create(courseId: number, createChapterDto: CreateChapterDto): Promise<Chapter>;
    findById(id: number): Promise<Chapter>;
    findByCourseId(courseId: number): Promise<Chapter[]>;
    update(id: number, updateChapterDto: UpdateChapterDto): Promise<Chapter>;
    remove(id: number): Promise<void>;
    updateSortOrder(id: number, sortOrder: number): Promise<Chapter>;
}
