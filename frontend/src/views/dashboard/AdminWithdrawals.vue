<!--
 * AdminWithdrawals.vue - 管理端提现审核页
 *
 * 功能描述：管理员查看和管理所有教师的提现申请，支持审核通过/驳回操作。
 *           默认展示待审核列表，可通过状态筛选查看已处理记录。
 *
 * 设计参考：Vuestic UI 双主题体系
-->
<template>
  <div class="admin-withdrawals">
    <!-- ========== 页面标题 ========== -->
    <div class="page-header">
      <div>
        <h2 class="page-title">提现审核</h2>
        <span class="page-desc">管理教师的提现申请，审核通过或驳回</span>
      </div>
    </div>

    <!-- ========== 状态筛选 ========== -->
    <div class="filter-bar">
      <div class="filter-group">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          class="filter-btn"
          :class="{ 'filter-btn--active': currentStatus === tab.value }"
          @click="switchStatus(tab.value)"
        >
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="filter-count">({{ tab.count }})</span>
        </button>
      </div>
    </div>

    <!-- ========== 加载态 ========== -->
    <div v-if="loading" class="loading-container">
      <div class="skeleton skeleton--row" v-for="i in 5" :key="i"></div>
    </div>

    <!-- ========== 提现列表 ========== -->
    <template v-else-if="list.length > 0">
      <div class="withdrawal-list">
        <div v-for="item in list" :key="item.id" class="withdrawal-item card">
          <div class="withdrawal-item__header">
            <div class="teacher-info">
              <div class="teacher-avatar">
                {{ (item.teacher?.realName || '?')[0] }}
              </div>
              <div class="teacher-detail">
                <span class="teacher-name">{{ item.teacher?.realName || '未知教师' }}</span>
                <span class="teacher-account">收款账号：{{ item.accountInfo || '未填写' }}</span>
              </div>
            </div>
            <div class="amount-info">
              <span class="amount-value">¥{{ (item.amount / 100).toFixed(2) }}</span>
              <span class="amount-status" :class="'status--' + item.status">{{ statusLabel(item.status) }}</span>
            </div>
          </div>

          <div class="withdrawal-item__meta">
            <span class="meta-time">申请时间：{{ formatDate(item.createdAt) }}</span>
            <span v-if="item.processedAt" class="meta-time">处理时间：{{ formatDate(item.processedAt) }}</span>
            <span v-if="item.remark" class="meta-remark">备注：{{ item.remark }}</span>
          </div>

          <!-- 审核操作区（仅待审核状态显示） -->
          <div v-if="item.status === 'pending'" class="withdrawal-item__actions">
            <div class="review-input">
              <input
                v-model="reviewRemarks[item.id]"
                class="form-input form-input--small"
                placeholder="审核意见（驳回时必填）"
              />
            </div>
            <div class="review-buttons">
              <button
                class="btn btn-primary btn-sm"
                style="background-color: var(--va-success); border-color: var(--va-success); color: #fff;"
                :disabled="reviewSubmitting[item.id]"
                @click="handleReview(item.id, 'approved')"
              >
                {{ reviewSubmitting[item.id] ? '处理中...' : '审核通过' }}
              </button>
              <button
                class="btn btn-danger btn-sm"
                :disabled="reviewSubmitting[item.id] || !reviewRemarks[item.id]?.trim()"
                @click="handleReview(item.id, 'rejected')"
              >
                {{ reviewSubmitting[item.id] ? '处理中...' : '驳回' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 分页 ========== -->
      <div class="pagination" v-if="totalPages > 1">
        <button class="pagination-btn" :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
        <span class="pagination-info">{{ page }} / {{ totalPages }}</span>
        <button class="pagination-btn" :disabled="page >= totalPages" @click="goPage(page + 1)">下一页</button>
      </div>
    </template>

    <!-- ========== 空状态 ========== -->
    <div v-else class="empty-state">
      <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
      <p class="empty-text">暂无提现记录</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { get, post } from '../../api/request';

const list = ref<any[]>([]);
const loading = ref(true);
const page = ref(1);
const totalPages = ref(1);
const currentStatus = ref('pending');

const reviewRemarks = reactive<Record<number, string>>({});
const reviewSubmitting = reactive<Record<number, boolean>>({});

const statusTabs = computed(() => [
  { value: 'pending', label: '待审核', count: pendingCount.value },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: '', label: '全部' },
]);

const pendingCount = ref(0);

function statusLabel(s: string): string {
  const map: Record<string, string> = { pending: '待审核', approved: '已到账', rejected: '已驳回' };
  return map[s] || s;
}

function formatDate(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleString('zh-CN');
}

async function fetchList() {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: 20 };
    if (currentStatus.value) params.status = currentStatus.value;
    const res = await get('/earnings/admin/withdrawals', { params });
    list.value = res.items || [];
    totalPages.value = res.meta?.totalPages || 1;
  } catch (err) {
    console.error(err);
    list.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchPendingCount() {
  try {
    const res: any = await get('/earnings/admin/pending-count');
    pendingCount.value = res.count || 0;
  } catch {}
}

function switchStatus(status: string) {
  currentStatus.value = status;
  page.value = 1;
  fetchList();
}

function goPage(p: number) {
  page.value = p;
  fetchList();
}

async function handleReview(id: number, action: 'approved' | 'rejected') {
  const remark = reviewRemarks[id]?.trim();
  if (action === 'rejected' && !remark) {
    ElMessage.warning('驳回时必须填写原因');
    return;
  }

  reviewSubmitting[id] = true;
  try {
    await post(`/earnings/admin/withdrawals/${id}/review`, {
      action,
      remark: remark || undefined,
    });
    ElMessage.success(action === 'approved' ? '审核通过' : '已驳回');
    reviewRemarks[id] = '';
    await fetchList();
    await fetchPendingCount();
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || '操作失败');
  } finally {
    reviewSubmitting[id] = false;
  }
}

onMounted(() => {
  fetchList();
  fetchPendingCount();
});
</script>

<style scoped>
/* 与现有管理端样式保持一致 */
.admin-withdrawals { max-width: 800px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-title { font-size: 1.25rem; font-weight: 700; color: var(--va-on-background-primary); margin: 0; }
.page-desc { font-size: 0.8125rem; color: var(--va-on-background-element); }

.filter-bar { margin-bottom: 1rem; }
.filter-group { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.filter-btn {
  padding: 0.5rem 1rem; font-size: 0.8125rem; border-radius: var(--va-square-border-radius);
  border: var(--va-block-border); background: var(--va-background-primary);
  color: var(--va-on-background-secondary); cursor: pointer; transition: var(--va-transition);
}
.filter-btn--active {
  background: var(--va-primary-alpha); color: var(--va-primary); border-color: var(--va-primary);
}
.filter-count { font-size: 0.75rem; }

.withdrawal-list { display: flex; flex-direction: column; gap: 0.75rem; }
.withdrawal-item {
  padding: 1.25rem; border: var(--va-block-border); border-radius: var(--va-block-border-radius);
  background: var(--va-background-primary);
}
.withdrawal-item__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.teacher-info { display: flex; align-items: center; gap: 0.75rem; }
.teacher-avatar {
  width: 2.25rem; height: 2.25rem; border-radius: 50%;
  background: linear-gradient(135deg, var(--va-primary), #00c4ff);
  color: var(--va-text-inverted); display: flex; align-items: center; justify-content: center;
  font-size: 0.8125rem; font-weight: 600;
}
.teacher-detail { display: flex; flex-direction: column; gap: 0.125rem; }
.teacher-name { font-size: 0.875rem; font-weight: 600; color: var(--va-on-background-primary); }
.teacher-account { font-size: 0.75rem; color: var(--va-on-background-element); }
.amount-info { text-align: right; }
.amount-value { font-size: 1.25rem; font-weight: 700; color: var(--va-on-background-primary); display: block; }
.amount-status { font-size: 0.75rem; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-weight: 600; }
.status--pending { color: var(--va-warning); background: rgba(245,158,11,0.12); }
.status--approved { color: var(--va-success); background: rgba(16,185,129,0.12); }
.status--rejected { color: var(--va-danger); background: rgba(239,68,68,0.12); }

.withdrawal-item__meta { display: flex; gap: 1rem; font-size: 0.75rem; color: var(--va-muted); margin-bottom: 0.75rem; }
.meta-remark { color: var(--va-on-background-secondary); }

.withdrawal-item__actions {
  display: flex; align-items: center; gap: 0.75rem;
  padding-top: 0.75rem; border-top: var(--va-block-border);
}
.review-input { flex: 1; }
.form-input {
  padding: 0.5rem 0.75rem; font-size: 0.8125rem; width: 100%; box-sizing: border-box;
  border: 1px solid var(--va-background-border); border-radius: var(--va-square-border-radius);
  background: var(--va-background-primary); color: var(--va-on-background-primary);
}
.form-input--small { padding: 0.375rem 0.625rem; }
.review-buttons { display: flex; gap: 0.5rem; flex-shrink: 0; }

/* skeleton */
.loading-container { display: flex; flex-direction: column; gap: 0.75rem; }
.skeleton {
  background: linear-gradient(90deg, var(--va-background-element) 25%, var(--va-background-secondary) 50%, var(--va-background-element) 75%);
  background-size: 200% 100%; animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--va-square-border-radius);
}
.skeleton--row { height: 80px; }
@keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1.5rem 0; }
.pagination-btn {
  padding: 0.5rem 1rem; font-size: 0.8125rem; border: var(--va-block-border);
  border-radius: var(--va-square-border-radius); background: var(--va-background-primary);
  color: var(--va-on-background-primary); cursor: pointer;
}
.pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pagination-info { font-size: 0.8125rem; color: var(--va-on-background-secondary); }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 3rem 1.5rem; gap: 0.75rem; }
.empty-icon { color: var(--va-muted); opacity: 0.5; }
.empty-text { font-size: 0.875rem; color: var(--va-muted); margin: 0; }
</style>
