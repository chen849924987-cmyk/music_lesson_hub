/**
 * 修复提现金额100倍错误脚本
 * 
 * 问题：前端+后端同时 *100，导致提现记录金额扩大了100倍
 * 正常：提100元 → 数据库存10000分 → Controller /100 → 前端显示100元
 * 错误：提100元 → 前端发10000分 → 后端又*100 → 数据库存1000000分 → 显示10000元
 */
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost', user: 'root', password: 'your-db-password-here', database: 'music_edu',
};

async function fix() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('✅ MySQL 连接成功\n');

  // 1. teachers 表 -检查明显异常的大数值即可
  const [teachers] = await conn.execute('SELECT id, realName, totalEarnings, withdrawableBalance, withdrawnAmount FROM teachers');
  console.log('=== teachers 表修复前 ===');
  teachers.forEach(t => console.log(`  [${t.id}] ${t.realName}: totalEarnings=${t.totalEarnings}, withdrawableBalance=${t.withdrawableBalance}, withdrawnAmount=${t.withdrawnAmount}`));

  for (const t of teachers) {
    if (t.withdrawnAmount > 100000) { // 正常测试数据提现不会超过1000元
      await conn.execute('UPDATE teachers SET withdrawnAmount = ROUND(withdrawnAmount / 100), updatedAt = NOW() WHERE id = ?', [t.id]);
    }
    if (Math.abs(t.withdrawableBalance) > 100000) {
      await conn.execute('UPDATE teachers SET withdrawableBalance = ROUND(withdrawableBalance / 100), updatedAt = NOW() WHERE id = ?', [t.id]);
    }
  }

  // 2. withdrawals 表 - 提现记录金额修复
  const [withdrawals] = await conn.execute('SELECT id, teacherId, amount, status FROM withdrawals');
  console.log('\n=== withdrawals 表 ===');
  for (const w of withdrawals) {
    if (w.amount > 100000) {
      const newVal = Math.round(w.amount / 100);
      await conn.execute('UPDATE withdrawals SET amount = ?, remark = CONCAT(IFNULL(remark,""), " [原数据×100已修复]"), updatedAt = NOW() WHERE id = ?', [newVal, w.id]);
      console.log(`  ✅ 修复 withdrawals[${w.id}] amount: ${w.amount} → ${newVal}`);
    } else {
      console.log(`  ✅ 正常 withdrawals[${w.id}] amount=${w.amount}`);
    }
  }

  // 3. earnings 表 - 提现相关负向记录
  const [earnings] = await conn.execute('SELECT id, teacherId, amount, actualAmount FROM earnings WHERE type = ?', ['withdrawal']);
  console.log('\n=== earnings 表（提现负向记录） ===');
  for (const e of earnings) {
    if (Math.abs(e.amount) > 100000) {
      const newAmount = Math.round(e.amount / 100);
      const newActual = Math.round(e.actualAmount / 100);
      await conn.execute('UPDATE earnings SET amount = ?, actualAmount = ? WHERE id = ?', [newAmount, newActual, e.id]);
      console.log(`  ✅ 修复 earnings[${e.id}] amount: ${e.amount}→${newAmount}, actualAmount: ${e.actualAmount}→${newActual}`);
    }
  }

  // 最终展示
  const [after] = await conn.execute('SELECT id, realName, totalEarnings, withdrawableBalance, withdrawnAmount FROM teachers');
  console.log('\n=== teachers 表修复后 ===');
  after.forEach(t => console.log(`  [${t.id}] ${t.realName}: totalEarnings=${t.totalEarnings}, withdrawableBalance=${t.withdrawableBalance}, withdrawnAmount=${t.withdrawnAmount}`));

  await conn.end();
  console.log('\n🎉 修复完成！刷新页面查看正确金额');
}

fix().catch(e => { console.error('❌ 失败:', e); process.exit(1); });
