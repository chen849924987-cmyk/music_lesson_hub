/**
 * 课程种子数据脚本
 * 功能描述：将测试用的图片和视频上传到 MinIO，并在数据库中创建 7 门课程
 * 包括：4 门单课程（single）+ 3 门系列课程（series）
 * 
 * 前置条件：
 * 1. MinIO 服务已启动（127.0.0.1:9000）
 * 2. MySQL 数据库已初始化（music_edu 库）
 * 3. 用户/分类/教师数据已通过 seed.js 创建
 * 
 * 使用方式：node scripts/seed_courses.js
 */

const Minio = require('minio');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const MINIO_CONFIG = {
  endPoint: '127.0.0.1',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
  bucket: 'music-edu',
};

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'your-db-password-here',
  database: 'music_edu',
};

const TEST_FILES_DIR = path.resolve(__dirname, '../../用于测试上传功能的视频和图片');

// ============ 课程数据定义 ============
/**
 * 7 门课程的完整数据
 * 覆盖：钢琴、吉他、声乐、乐理四个分类
 * 单课程 4 门 + 系列课程 3 门
 * 所有课程均为已上架（approved），其中 3 门设为推荐
 */
const COURSES_DATA = [
  // ========== 单课程（4 门）- 单课程只有 1 个课时 ==========
  {
    title: '零基础钢琴入门教程',
    description: '专为钢琴零基础学员设计的入门课程，从认识键盘开始，逐步掌握基本指法和简单乐曲演奏。课程内容涵盖手型训练、音阶练习、和弦基础等核心知识点，让您在短时间内快速上手钢琴演奏。',
    categoryName: '钢琴',
    courseType: 'single',
    price: 9900, // 99元
    originalPrice: 19900,
    isRecommended: true,
    tags: '钢琴,入门,零基础,指法',
    studentCount: 0,
    lessons: [
      { title: '零基础钢琴入门教程（完整版）', duration: 3600, isFree: true },
    ],
  },
  {
    title: '流行吉他弹唱速成',
    description: '想快速学会弹唱流行歌曲？本课程将从最基础的吉他构造开始，教您掌握常用和弦、扫弦节奏型、分解和弦模式，让您能够流畅地自弹自唱。适合有一定乐感但零吉他基础的学员。',
    categoryName: '吉他',
    courseType: 'single',
    price: 12900, // 129元
    originalPrice: 25900,
    isRecommended: true,
    tags: '吉他,弹唱,流行,速成',
    studentCount: 0,
    lessons: [
      { title: '流行吉他弹唱速成（完整版）', duration: 3600, isFree: true },
    ],
  },
  {
    title: '声乐发声技巧与气息训练',
    description: '系统学习科学的发声方法，掌握腹式呼吸、共鸣腔运用、真假声转换等核心技巧。课程包含大量实操练习，适合希望提升歌唱水平的各阶段学员。',
    categoryName: '声乐',
    courseType: 'single',
    price: 7900, // 79元
    originalPrice: 15900,
    isRecommended: false,
    tags: '声乐,发声,气息,唱歌',
    studentCount: 0,
    lessons: [
      { title: '声乐发声技巧与气息训练（完整版）', duration: 3600, isFree: true },
    ],
  },
  {
    title: '基础乐理知识全攻略',
    description: '掌握音乐理论的基础知识，从音名、音程、和弦到调式分析，为深入学习乐器或声乐奠定坚实的理论基础。课程采用通俗易懂的方式讲解抽象概念，配合大量实例帮助理解。',
    categoryName: '乐理',
    courseType: 'single',
    price: 5900, // 59元
    originalPrice: 11900,
    isRecommended: false,
    tags: '乐理,音程,和弦,调式',
    studentCount: 0,
    lessons: [
      { title: '基础乐理知识全攻略（完整版）', duration: 3600, isFree: true },
    ],
  },
  // ========== 系列课程（3 门）==========
  {
    title: '钢琴进阶技巧系统班',
    description: '从入门到进阶的系统性钢琴课程，覆盖音阶进阶、琶音技巧、踏板运用、即兴伴奏等高阶内容。本系列课程共分为三个章节，循序渐进地提升您的钢琴演奏水平。',
    categoryName: '钢琴',
    courseType: 'series',
    price: 29900, // 299元（系列全套价格）
    originalPrice: 49900,
    isRecommended: true,
    tags: '钢琴,进阶,技巧,系统班',
    studentCount: 0,
    chapters: [
      {
        title: '第一章：音阶与琶音进阶',
        sortOrder: 1,
        lessons: [
          { title: '24个大小调音阶系统训练', duration: 900, canSinglePurchase: true, singlePrice: 5900 },
          { title: '三度与六度音阶练习', duration: 720, isFree: true },
          { title: '长琶音与短琶音技巧', duration: 840, canSinglePurchase: true, singlePrice: 4900 },
        ],
      },
      {
        title: '第二章：踏板与触键技巧',
        sortOrder: 2,
        lessons: [
          { title: '延音踏板的使用原理', duration: 600, canSinglePurchase: true, singlePrice: 3900 },
          { title: '半踏板与抖动踏板技巧', duration: 540 },
          { title: '连奏、断奏与跳音技巧', duration: 720 },
        ],
      },
      {
        title: '第三章：即兴伴奏与演奏',
        sortOrder: 3,
        lessons: [
          { title: '和弦进行与伴奏模式', duration: 780, canSinglePurchase: true, singlePrice: 4900 },
          { title: '流行歌曲即兴伴奏实战', duration: 960 },
        ],
      },
    ],
  },
  {
    title: '民谣吉他系统学习',
    description: '从零开始系统学习民谣吉他，涵盖基础和弦、指弹技巧、弹唱配合、即兴SOLO等全方位内容。采用章节式教学，每章聚焦一个核心技能，帮助您成为真正的吉他手。',
    categoryName: '吉他',
    courseType: 'series',
    price: 24900, // 249元
    originalPrice: 39900,
    isRecommended: false,
    tags: '吉他,民谣,系统,指弹',
    studentCount: 0,
    chapters: [
      {
        title: '第一章：基础巩固',
        sortOrder: 1,
        lessons: [
          { title: '常用和弦指型大全', duration: 600 },
          { title: '右手指法模式训练', duration: 540, isFree: true },
          { title: '横按技巧突破', duration: 720 },
        ],
      },
      {
        title: '第二章：指弹入门',
        sortOrder: 2,
        lessons: [
          { title: '指弹基本指法模式', duration: 660 },
          { title: '经典指弹曲目练习', duration: 840 },
          { title: '打板与泛音技巧', duration: 480 },
        ],
      },
      {
        title: '第三章：弹唱与即兴',
        sortOrder: 3,
        lessons: [
          { title: '弹唱配合节奏训练', duration: 600 },
          { title: '变调夹的使用与移调', duration: 360 },
          { title: '即兴SOLO基础', duration: 720 },
        ],
      },
    ],
  },
  {
    title: '专业声乐训练营',
    description: '针对有基础声乐学员的高阶训练课程，深入讲解胸声、头声、混声的协调运用，以及舞台表现力、录音技巧等专业内容。本课程适合希望走向专业道路的声乐爱好者。',
    categoryName: '声乐',
    courseType: 'series',
    price: 39900, // 399元
    originalPrice: 59900,
    isRecommended: false,
    tags: '声乐,专业,进阶,训练营',
    studentCount: 0,
    chapters: [
      {
        title: '第一章：声音的扩展',
        sortOrder: 1,
        lessons: [
          { title: '音域扩展系统训练', duration: 900 },
          { title: '胸声与头声的平衡', duration: 720, isFree: true },
          { title: '混声技术的深化', duration: 840 },
        ],
      },
      {
        title: '第二章：技巧精进',
        sortOrder: 2,
        lessons: [
          { title: '颤音与装饰音技巧', duration: 540 },
          { title: '弱声与强声控制', duration: 600 },
          { title: '转音与即兴处理', duration: 660 },
        ],
      },
      {
        title: '第三章：实战与表演',
        sortOrder: 3,
        lessons: [
          { title: '舞台表现力训练', duration: 480 },
          { title: '录音棚演唱技巧', duration: 540 },
          { title: '现场演唱实战演练', duration: 720 },
        ],
      },
    ],
  },
];

/**
 * 将测试文件上传到 MinIO（如果不存在则上传）
 * @param {Minio.Client} minioClient - MinIO 客户端
 * @param {string} bucket - 存储桶名称
 * @param {string} localPath - 本地文件路径
 * @param {string} objectName - MinIO 对象名
 * @param {string} contentType - 文件 MIME 类型
 * @returns {Promise<string>} 上传后的对象名
 */
async function uploadIfNotExists(minioClient, bucket, localPath, objectName, contentType) {
  try {
    await minioClient.statObject(bucket, objectName);
    console.log(`  ℹ️ 文件已存在，跳过上传: ${objectName}`);
  } catch (err) {
    if (err.code === 'NotFound') {
      const fileBuffer = fs.readFileSync(localPath);
      await minioClient.putObject(bucket, objectName, fileBuffer, fileBuffer.length, {
        'Content-Type': contentType,
      });
      console.log(`  ✅ 上传成功: ${objectName} (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      throw err;
    }
  }
  return objectName;
}

/**
 * 主函数：创建课程种子数据
 */
async function seedCourses() {
  console.log('🎵 开始创建课程种子数据...\n');

  // 1. 连接 MinIO
  const minioClient = new Minio.Client(MINIO_CONFIG);
  console.log('✅ MinIO 连接成功');

  // 2. 确保存储桶存在
  const bucketExists = await minioClient.bucketExists(MINIO_CONFIG.bucket);
  if (!bucketExists) {
    await minioClient.makeBucket(MINIO_CONFIG.bucket, 'us-east-1');
    console.log(`✅ 创建存储桶: ${MINIO_CONFIG.bucket}`);
  }

  // 3. 上传测试文件到 MinIO
  console.log('\n📤 上传测试文件到 MinIO...');
  const imagePath = path.join(TEST_FILES_DIR, 'default-course.jpeg');
  const videoPath = path.join(TEST_FILES_DIR, 'default-video.mp4');

  const coverObjectName = 'seed/default-cover.jpeg';
  const videoObjectName = 'seed/default-video.mp4';

  await uploadIfNotExists(minioClient, MINIO_CONFIG.bucket, imagePath, coverObjectName, 'image/jpeg');
  await uploadIfNotExists(minioClient, MINIO_CONFIG.bucket, videoPath, videoObjectName, 'video/mp4');

  // 4. 连接 MySQL
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('\n✅ MySQL 连接成功');

  // 5. 查询已有数据
  const [existingCourses] = await conn.execute('SELECT id, title FROM courses');
  if (existingCourses.length > 0) {
    console.log(`\n⚠️ 数据库中已存在 ${existingCourses.length} 门课程，将跳过创建（如需重新创建，请先手动清空课程/章节/课时/视频表）`);
    console.log('现有课程列表：');
    existingCourses.forEach((c) => console.log(`  - ID=${c.id}: ${c.title}`));
    await conn.end();
    return;
  }

  // 6. 查询分类和教师信息
  const [categories] = await conn.execute('SELECT id, name FROM categories');
  const catMap = {};
  categories.forEach((c) => { catMap[c.name] = c.id; });

  const [teachers] = await conn.execute(
    'SELECT t.id, t.userId, t.realName, u.username FROM teachers t JOIN users u ON t.userId = u.id WHERE u.username = ?',
    ['teacher01']
  );
  if (teachers.length === 0) {
    console.error('❌ 未找到教师 teacher01，请先运行 seed.js');
    await conn.end();
    return;
  }
  const teacherId = teachers[0].id;
  const teacherUserId = teachers[0].userId;
  console.log(`👨‍🏫 使用教师: ${teachers[0].realName} (ID=${teacherId}, userId=${teacherUserId})`);

  // 7. 创建课程数据
  console.log('\n📚 开始创建课程...\n');

  for (let ci = 0; ci < COURSES_DATA.length; ci++) {
    const courseData = COURSES_DATA[ci];
    const catId = catMap[courseData.categoryName];
    if (!catId) {
      console.error(`❌ 未找到分类: ${courseData.categoryName}，跳过课程: ${courseData.title}`);
      continue;
    }

    // 计算总视频时长（用于单课程的视频记录）
    let totalDuration = 0;
    if (courseData.courseType === 'single') {
      courseData.lessons.forEach((l) => { totalDuration += l.duration; });
    } else {
      courseData.chapters.forEach((ch) => {
        ch.lessons.forEach((l) => { totalDuration += l.duration; });
      });
    }

    // 7.1 创建视频记录（共用同一个测试视频）
    const videoRecordResult = await conn.execute(
      `INSERT INTO videos (objectName, originalName, mimeType, fileSize, duration, userId, isDeleted, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
      [videoObjectName, `seed-video-${ci + 1}.mp4`, 'video/mp4', 50594694, Math.round(totalDuration / (courseData.courseType === 'single' ? courseData.lessons.length : getTotalLessonsCount(courseData))), teacherUserId]
    );
    const videoId = videoRecordResult[0].insertId;

    // 7.2 插入课程记录 - 已上架且已审核
    const courseInsertResult = await conn.execute(
      `INSERT INTO courses (title, cover, description, categoryId, teacherId, courseType, price, originalPrice, 
        status, previewDuration, reviewComment, reviewerId, reviewedAt, tags, studentCount, rating, reviewCount, 
        isRecommended, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', 120, '种子数据自动审核通过', 1, NOW(), ?, ?, 4.5, 0, ?, ?, NOW(), NOW())`,
      [
        courseData.title,
        coverObjectName,
        courseData.description,
        catId,
        teacherId,
        courseData.courseType,
        courseData.price,
        courseData.originalPrice,
        courseData.tags,
        courseData.studentCount,
        courseData.isRecommended ? 1 : 0,
        courseData.isRecommended ? 0 : 10 + ci, // 推荐的排前面
      ]
    );
    const courseId = courseInsertResult[0].insertId;
    console.log(`  📖 [${ci + 1}/7] "${courseData.title}" (${courseData.courseType}, category=${courseData.categoryName}, price=${(courseData.price / 100).toFixed(0)}元)`);

    // 7.3 创建章节/课时
    if (courseData.courseType === 'single') {
      // 单课程：直接创建课时（chapterId 为 null）
      for (let li = 0; li < courseData.lessons.length; li++) {
        const lesson = courseData.lessons[li];
        const lessonDuration = Math.round(totalDuration / courseData.lessons.length); // 每个课时分配相同时长
        await conn.execute(
          `INSERT INTO lessons (courseId, chapterId, title, duration, videoId, isFree, previewDuration, sortOrder, canSinglePurchase, singlePrice, createdAt, updatedAt)
           VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [courseId, lesson.title, lesson.duration, videoId, lesson.isFree ? 1 : 0, lesson.isFree ? 120 : 0, li, lesson.canSinglePurchase ? 1 : 0, lesson.singlePrice || 0]
        );
      }
      console.log(`     📝 ${courseData.lessons.length} 个课时`);
    } else {
      // 系列课程：创建章节 → 课时
      for (let chi = 0; chi < courseData.chapters.length; chi++) {
        const chapter = courseData.chapters[chi];
        const chapterResult = await conn.execute(
          `INSERT INTO chapters (courseId, title, sortOrder, createdAt, updatedAt)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [courseId, chapter.title, chapter.sortOrder]
        );
        const chapterId = chapterResult[0].insertId;

        for (let li = 0; li < chapter.lessons.length; li++) {
          const lesson = chapter.lessons[li];
          await conn.execute(
          `INSERT INTO lessons (courseId, chapterId, title, duration, videoId, isFree, previewDuration, sortOrder, canSinglePurchase, singlePrice, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [courseId, chapterId, lesson.title, lesson.duration, videoId, lesson.isFree ? 1 : 0, lesson.isFree ? 120 : 0, li, lesson.canSinglePurchase ? 1 : 0, lesson.singlePrice || 0]
          );
        }
      }
      console.log(`     📝 ${courseData.chapters.length} 个章节，共 ${getTotalLessonsCount(courseData)} 个课时`);
    }
  }

  await conn.end();
  console.log('\n🎉 所有 7 门课程已成功创建！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 提示：教师 teacher01 登录后可在"课程管理"中查看这些课程');
  console.log('💡 提示：学员可在首页热门课程和课程中心浏览已上架的课程');
  console.log('💡 提示：3 门推荐课程（入门钢琴/吉他速成/钢琴进阶）会优先展示');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * 计算系列课程的总课时数
 */
function getTotalLessonsCount(courseData) {
  let count = 0;
  if (courseData.chapters) {
    courseData.chapters.forEach((ch) => { count += ch.lessons.length; });
  }
  return count;
}

seedCourses().catch((err) => {
  console.error('❌ 种子数据创建失败:', err.message);
  process.exit(1);
});
