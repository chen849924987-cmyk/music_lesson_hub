/**
 * 收益演示数据生成脚本
 * 功能描述：为收益看板生成演示数据，包括模拟订单、订单项、收益记录和教师余额。
 *         数据分布在过去30天内，使趋势图、排行榜都有数据展示。
 *
 * 使用方式：node scripts/seed-earnings-demo.js
 * 前置条件：需先运行 seed.js 初始化基础数据（用户、教师、课程）
 *
 * 注意：本脚本会创建模拟的已支付订单，但不会调用支付宝支付API。
 *       收益记录直接写入数据库，仅用于演示看板效果。
 */
const mysql = require('mysql2/promise');

// ================================================================
// 数据库配置（与项目保持一致）
// ================================================================
const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'your-db-password-here',
  database: 'music_edu',
};

// ================================================================
// 模拟数据配置
// ================================================================

/** 过去N天的数据分布 */
const DAYS = 30;

/** 每天最少订单数 */
const MIN_DAILY_ORDERS = 1;

/** 每天最多订单数 */
const MAX_DAILY_ORDERS = 5;

/** 课程单价范围（单位：分，即元*100） */
const PRICE_RANGE = {
  min: 1990,   // 19.90元
  max: 29900,  // 299.00元
};

/** 平台分成比例（30% 平台 / 70% 教师） */
const PLATFORM_SHARE_RATE = 0.3;

// ================================================================
// 工具函数
// ================================================================

/**
 * 生成指定范围内的随机整数
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机价格（在范围内取整百，模拟真实定价）
 */
function randomPrice() {
  const base = randomInt(PRICE_RANGE.min, PRICE_RANGE.max);
  // 取整到100的倍数（方便阅读）
  return Math.round(base / 100) * 100;
}

/**
 * 生成唯一订单号
 */
function generateOrderNo(date) {
  const timestamp =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0') +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0') +
    String(date.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `DEMO${timestamp}${random}`;
}

// ================================================================
// 主逻辑
// ================================================================

async function main() {
  console.log('🔌 连接数据库...');
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('✅ 连接成功');

  try {
    // ---- Step 1: 获取现有教师和课程 ----
    console.log('\n📦 查询现有数据...');

    const [teachers] = await conn.query(
      'SELECT t.id, t.userId, t.realName FROM teachers t'
    );
    if (teachers.length === 0) {
      console.error('❌ 没有找到教师数据，请先运行 seed.js');
      return;
    }
    console.log(`   找到 ${teachers.length} 位教师`);

    const [courses] = await conn.query(
      'SELECT c.id, c.title, c.price, c.teacherId FROM courses c WHERE c.status = \'approved\''
    );
    if (courses.length === 0) {
      console.error('❌ 没有找到已上架课程，请先上架课程');
      return;
    }
    console.log(`   找到 ${courses.length} 门已上架课程`);

    // 按教师分组课程
    const coursesByTeacher = {};
    for (const course of courses) {
      if (!coursesByTeacher[course.teacherId]) {
        coursesByTeacher[course.teacherId] = [];
      }
      coursesByTeacher[course.teacherId].push(course);
    }

    // 获取一些学员用户（用于生成模拟购买记录）
    const [students] = await conn.query(
      "SELECT id FROM users WHERE role = 'student' LIMIT 20"
    );
    let studentIds;
    if (students.length > 0) {
      studentIds = students.map(s => s.id);
    } else {
      // 如果没有学员用户，创建一个
      console.log('   创建模拟学员用户...');
      const [result] = await conn.query(
        "INSERT INTO users (username, password, nickname, role) VALUES ('demo_student', '$2b$10$dummy', '演示学员', 'student')"
      );
      studentIds = [result.insertId];
    }
    console.log(`   找到 ${studentIds.length} 个学员用户`);

    // ---- Step 2: 生成演示订单和收益数据 ----
    console.log('\n💰 生成演示收益数据...');

    let totalOrders = 0;
    let totalEarnings = 0;

    // 记录每位教师的总收益和可提现金额（用于最后更新 teachers 表）
    const teacherTotals = {};
    for (const t of teachers) {
      teacherTotals[t.id] = {
        totalEarnings: 0,
        withdrawableBalance: 0,
      };
    }

    const now = new Date();

    // 逐天生成数据
    for (let dayOffset = DAYS; dayOffset >= 0; dayOffset--) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      // 设置随机时间（8:00 ~ 22:00）
      date.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59));

      const dailyOrderCount = randomInt(MIN_DAILY_ORDERS, MAX_DAILY_ORDERS);

      for (let o = 0; o < dailyOrderCount; o++) {
        // 随机选择一个学员
        const userId = studentIds[randomInt(0, studentIds.length - 1)];

        // 随机选择一个教师
        const teacher = teachers[randomInt(0, teachers.length - 1)];
        const teacherCourses = coursesByTeacher[teacher.id] || [];
        if (teacherCourses.length === 0) continue;

        // 随机选择1~2门课程
        const courseCount = randomInt(1, Math.min(2, teacherCourses.length));
        const selectedCourses = [];
        const shuffled = [...teacherCourses].sort(() => Math.random() - 0.5);
        for (let c = 0; c < courseCount; c++) {
          selectedCourses.push(shuffled[c]);
        }

        // 获取课程单价（用课程实际价格或随机价格）
        const itemPrices = selectedCourses.map(c => c.price > 0 ? c.price : randomPrice());
        const totalAmount = itemPrices.reduce((s, p) => s + p, 0);

        // 跳过免费课程
        if (totalAmount <= 0) continue;

        // 生成订单号
        const orderNo = generateOrderNo(date);

        // 插入订单
        const [orderResult] = await conn.query(
          `INSERT INTO orders (orderNo, userId, totalAmount, status, orderType, paidAt, createdAt, updatedAt)
           VALUES (?, ?, ?, 'paid', 'single_course', ?, ?, ?)`,
          [
            orderNo,
            userId,
            totalAmount,
            date,
            date,
            date,
          ]
        );
        const orderId = orderResult.insertId;

        // 插入订单项
        for (let i = 0; i < selectedCourses.length; i++) {
          const course = selectedCourses[i];
          const price = itemPrices[i];
          await conn.query(
            `INSERT INTO order_items (orderId, courseId, courseTitle, price, quantity, createdAt)
             VALUES (?, ?, ?, ?, 1, ?)`,
            [orderId, course.id, course.title, price, date]
          );
        }

        // 计算收益
        const platformShare = Math.round(totalAmount * PLATFORM_SHARE_RATE);
        const actualAmount = totalAmount - platformShare;

        // 插入收益记录
        const courseTitle = selectedCourses.length === 1
          ? selectedCourses[0].title
          : `${selectedCourses[0].title} 等 ${selectedCourses.length} 门课程`;

        await conn.query(
          `INSERT INTO earnings (teacherId, orderId, courseId, courseTitle, amount, platformShare, actualAmount, type, status, remark, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'course_sale', 'settled', ?, ?)`,
          [
            teacher.id,
            orderId,
            selectedCourses[0].id,
            courseTitle,
            totalAmount,
            platformShare,
            actualAmount,
            `订单 ${orderNo} 支付完成（演示数据）`,
            date,
          ]
        );

        // 更新教师累计
        teacherTotals[teacher.id].totalEarnings += totalAmount;
        teacherTotals[teacher.id].withdrawableBalance += actualAmount;

        totalOrders++;
        totalEarnings += totalAmount;
      }
    }

    // ---- Step 3: 更新 teachers 表的总收益和可提现余额 ----
    console.log('\n📊 更新教师收益余额...');
    for (const [teacherId, totals] of Object.entries(teacherTotals)) {
      if (totals.totalEarnings > 0) {
        await conn.query(
          `UPDATE teachers SET
             totalEarnings = totalEarnings + ?,
             withdrawableBalance = withdrawableBalance + ?
           WHERE id = ?`,
          [totals.totalEarnings, totals.withdrawableBalance, parseInt(teacherId)]
        );
        console.log(`   教师ID=${teacherId}: 总收益增加 ${(totals.totalEarnings / 100).toFixed(2)} 元`);
      }
    }

    // ---- Step 4: 输出统计 ----
    console.log('\n========================================');
    console.log(' ✅ 收益演示数据生成完成！');
    console.log('========================================');
    console.log(` 📅 数据跨度：${DAYS} 天`);
    console.log(` 📦 生成订单：${totalOrders} 笔`);
    console.log(` 💰 总流水：${(totalEarnings / 100).toFixed(2)} 元`);
    console.log(` 📊 平台分成：${(totalEarnings * PLATFORM_SHARE_RATE / 100).toFixed(2)} 元`);
    console.log(` 👨‍🏫 教师总收益：${(totalEarnings * (1 - PLATFORM_SHARE_RATE) / 100).toFixed(2)} 元`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 脚本执行失败:', error.message);
    console.error(error);
  } finally {
    await conn.end();
    console.log('🔌 数据库连接已关闭');
  }
}

main();
