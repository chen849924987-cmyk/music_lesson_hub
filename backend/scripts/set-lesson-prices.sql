-- ============================================================
-- 系列课单课单独购买·预设价格脚本
-- 功能描述：为已有系列课程的所有课时设置"可单独购买"属性及预设价格
-- 使用方式：在 MySQL 中执行此脚本
-- ============================================================

-- 1. 为"钢琴进阶技巧系统班"（price=29900, 8课时）的课时设置单独购买价格
--    单课时价格 = 总价 / 课时数 * 1.2（略高于均价以鼓励购买整课）
UPDATE lessons l
JOIN chapters ch ON l.chapterId = ch.id
JOIN courses c ON ch.courseId = c.id AND c.title = '钢琴进阶技巧系统班'
SET l.canSinglePurchase = 1,
    l.singlePrice = ROUND(c.price / 8 * 1.2 / 100) * 100;  -- 约4485分 ≈ 44.85元/课时

-- 2. 为"民谣吉他系统学习"（price=24900, 9课时）的课时设置单独购买价格
UPDATE lessons l
JOIN chapters ch ON l.chapterId = ch.id
JOIN courses c ON ch.courseId = c.id AND c.title = '民谣吉他系统学习'
SET l.canSinglePurchase = 1,
    l.singlePrice = ROUND(c.price / 9 * 1.2 / 100) * 100;  -- 约3320分 ≈ 33.20元/课时

-- 3. 为"专业声乐训练营"（price=39900, 9课时）的课时设置单独购买价格
UPDATE lessons l
JOIN chapters ch ON l.chapterId = ch.id
JOIN courses c ON ch.courseId = c.id AND c.title = '专业声乐训练营'
SET l.canSinglePurchase = 1,
    l.singlePrice = ROUND(c.price / 9 * 1.2 / 100) * 100;  -- 约5320分 ≈ 53.20元/课时

-- 4. 验证结果
SELECT 
  c.title AS '课程名称',
  ch.title AS '章节名称',
  l.title AS '课时名称',
  l.canSinglePurchase AS '允许单独购买',
  l.singlePrice AS '单独购买价格(分)',
  ROUND(l.singlePrice / 100, 2) AS '单独购买价格(元)'
FROM lessons l
JOIN chapters ch ON l.chapterId = ch.id
JOIN courses c ON ch.courseId = c.id
WHERE c.courseType = 'series'
ORDER BY c.title, ch.sortOrder, l.sortOrder;
