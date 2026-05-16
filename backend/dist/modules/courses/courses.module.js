"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoursesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const category_entity_1 = require("./entities/category.entity");
const course_entity_1 = require("./entities/course.entity");
const chapter_entity_1 = require("./entities/chapter.entity");
const lesson_entity_1 = require("./entities/lesson.entity");
const course_review_entity_1 = require("./entities/course-review.entity");
const user_course_entity_1 = require("./entities/user-course.entity");
const user_lesson_entity_1 = require("./entities/user-lesson.entity");
const categories_service_1 = require("./categories.service");
const courses_service_1 = require("./courses.service");
const chapters_service_1 = require("./chapters.service");
const lessons_service_1 = require("./lessons.service");
const categories_controller_1 = require("./categories.controller");
const courses_controller_1 = require("./courses.controller");
const chapters_controller_1 = require("./chapters.controller");
const lessons_controller_1 = require("./lessons.controller");
const videos_module_1 = require("../videos/videos.module");
let CoursesModule = class CoursesModule {
};
exports.CoursesModule = CoursesModule;
exports.CoursesModule = CoursesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([category_entity_1.Category, course_entity_1.Course, chapter_entity_1.Chapter, lesson_entity_1.Lesson, course_review_entity_1.CourseReview, user_course_entity_1.UserCourse, user_lesson_entity_1.UserLesson]),
            videos_module_1.VideosModule,
        ],
        controllers: [
            categories_controller_1.CategoriesController,
            courses_controller_1.CoursesController,
            chapters_controller_1.ChaptersController,
            lessons_controller_1.LessonsController,
        ],
        providers: [
            categories_service_1.CategoriesService,
            courses_service_1.CoursesService,
            chapters_service_1.ChaptersService,
            lessons_service_1.LessonsService,
        ],
        exports: [
            courses_service_1.CoursesService,
            categories_service_1.CategoriesService,
        ],
    })
], CoursesModule);
//# sourceMappingURL=courses.module.js.map