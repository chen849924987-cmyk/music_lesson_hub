import { Repository } from 'typeorm';
import { Lesson } from './entities/lesson.entity';
import { Chapter } from './entities/chapter.entity';
import { Video } from '../videos/entities/video.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
export declare class LessonsService {
    private readonly lessonRepository;
    private readonly chapterRepository;
    private readonly videoRepository;
    constructor(lessonRepository: Repository<Lesson>, chapterRepository: Repository<Chapter>, videoRepository: Repository<Video>);
    create(courseId: number, createLessonDto: CreateLessonDto): Promise<Lesson>;
    findById(id: number): Promise<Lesson>;
    findByCourseId(courseId: number): Promise<Lesson[]>;
    findByChapterId(chapterId: number): Promise<Lesson[]>;
    update(id: number, updateLessonDto: UpdateLessonDto): Promise<Lesson>;
    remove(id: number): Promise<void>;
    updateSortOrder(id: number, sortOrder: number): Promise<Lesson>;
}
