<!--
 * CouponManage - 优惠券管理页面
 *
 * 功能描述：管理后台的优惠券管理页面，支持优惠券的创建、编辑、删除、
 *           启用/禁用、列表查询和状态筛选等功能。
 *           由于目前无运营账号，优惠券管理放在超级管理员（super_admin）下。
 *
 * 设计参考：Vuestic UI 双主题设计体系，使用 --va-* CSS 变量
 -->

<template>
  <div class="coupon-manage">
    <!-- ========== 页面头部 ========== -->
    <div class="page-header">
      <h2 class="page-title">优惠券管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon style="margin-right: 4px;"><Plus /></el-icon>
        创建优惠券
      </el-button>
    </div>

    <!-- ========== 搜索和筛选区域 ========== -->
    <div class="filter-section">
      <div class="filter-row">
        <el-input
          v-model="queryParams.name"
          placeholder="搜索优惠券名称"
          clearable
          style="width: 200px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="queryParams.code"
          placeholder="搜索优惠券码"
          clearable
          style="width: 180px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="queryParams.type"
          placeholder="优惠券类型"
          clearable
          style="width: 140px"
          @change="handleSearch"
        >
          <el-option label="满减券" value="fixed" />
          <el-option label="折扣券" value="percentage" />
        </el-select>
        <el-select
          v-model="queryParams.isActive"
          placeholder="启用状态"
          clearable
          style="width: 130px"
          @change="handleSearch"
        >
          <el-option label="已启用" :value="true" />
          <el-option label="已停用" :value="false" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
    </div>

    <!-- ========== 表格区域 ========== -->
    <div class="table-section">
      <el-table
        :data="couponList"
        v-loading="loading"
        stripe
        style="width: 100%"
        empty-text="暂无优惠券数据"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="code" label="优惠券码" width="130" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'fixed' ? 'primary' : 'warning'" size="small">
              {{ row.type === 'fixed' ? '满减券' : '折扣券' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠内容" width="140" align="center">
          <template #default="{ row }">
            <span v-if="row.type === 'fixed'">
              ￥{{ (row.discount / 100).toFixed(2) }}
            </span>
            <span v-else>
              {{ row.discount }}% off
              <span v-if="row.maxDiscount" style="font-size: 12px; color: var(--va-muted);">
                (最高减￥{{ (row.maxDiscount / 100).toFixed(0) }})
              </span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="使用门槛" width="110" align="center">
          <template #default="{ row }">
            <span v-if="row.minAmount > 0">
              满￥{{ (row.minAmount / 100).toFixed(2) }}
            </span>
            <span v-else style="color: var(--va-muted);">无门槛</span>
          </template>
        </el-table-column>
        <el-table-column label="库存" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.totalCount === -1">不限量</span>
            <span v-else :class="{ 'text-danger': row.remainingCount <= 0 }">
              {{ row.remainingCount }}/{{ row.totalCount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="170">
          <template #default="{ row }">
            <span class="text-sm">{{ formatDate(row.startTime) }} ~ {{ formatDate(row.endTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.isActive"
              :loading="row._toggling"
              @change="(val: boolean) => handleToggleActive(row, val)"
              active-text="启用"
              inactive-text="停用"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-popconfirm
              title="确认删除此优惠券？"
              confirm-button-text="确认"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchCouponList"
          @current-change="fetchCouponList"
        />
      </div>
    </div>

    <!-- ========== 创建/编辑弹窗 ========== -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑优惠券' : '创建优惠券'"
      width="600px"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        label-position="right"
        size="default"
      >
        <!-- 基本信息 -->
        <h4 class="form-section-title">基本信息</h4>

        <el-form-item label="优惠券名称" prop="name">
          <el-input v-model="formData.name" placeholder="例如：新人优惠券" maxlength="50" />
        </el-form-item>

        <el-form-item label="优惠券码" prop="code">
          <el-input
            v-model="formData.code"
            placeholder="唯一标识码，例如：NEW10"
            :disabled="isEditing"
            maxlength="20"
          />
          <div class="form-tip" v-if="!isEditing">领取时需要输入的码，创建后不可修改</div>
        </el-form-item>

        <el-form-item label="优惠券类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio label="fixed">满减券</el-radio>
            <el-radio label="percentage">折扣券</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 优惠内容 -->
        <h4 class="form-section-title">优惠内容</h4>

        <el-form-item label="优惠面值" prop="discount">
          <template v-if="formData.type === 'fixed'">
            <el-input-number
              v-model="formData.discount"
              :min="1"
              :max="99999999"
              :step="100"
              style="width: 200px"
            />
            <span class="form-unit">分（{{ ((formData.discount || 0) / 100).toFixed(2) }}元）</span>
          </template>
          <template v-else>
            <el-input-number
              v-model="formData.discount"
              :min="1"
              :max="99"
              :step="1"
              style="width: 120px"
            />
            <span class="form-unit">%（即{{ 100 - (formData.discount || 0) }}折）</span>
          </template>
        </el-form-item>

        <el-form-item label="最低使用门槛" prop="minAmount">
          <el-input-number
            v-model="formData.minAmount"
            :min="0"
            :max="99999999"
            :step="1000"
            style="width: 200px"
          />
          <span class="form-unit">
            分（{{ ((formData.minAmount || 0) / 100).toFixed(2) }}元，0表示无门槛）
          </span>
        </el-form-item>

        <el-form-item label="最大减免金额" prop="maxDiscount" v-if="formData.type === 'percentage'">
          <el-input-number
            v-model.number="formData.maxDiscount!"
            :min="1"
            :max="99999999"
            :step="100"
            style="width: 200px"
          />
          <span class="form-unit">分（空表示不限制）</span>
          <div class="form-tip">折扣券最多可减免的金额上限</div>
        </el-form-item>

        <!-- 库存与限领 -->
        <h4 class="form-section-title">库存与限领</h4>

        <el-form-item label="总发放数量" prop="totalCount">
          <el-input-number
            v-model="formData.totalCount"
            :min="-1"
            :max="999999"
            :step="1"
            style="width: 200px"
          />
          <span class="form-unit">张（-1表示不限量）</span>
        </el-form-item>

        <el-form-item label="每人限领" prop="perUserLimit">
          <el-input-number
            v-model="formData.perUserLimit"
            :min="0"
            :max="100"
            :step="1"
            style="width: 120px"
          />
          <span class="form-unit">张（0表示不限制）</span>
        </el-form-item>

        <!-- 有效期 -->
        <h4 class="form-section-title">有效期</h4>

        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="formData.startTime"
            type="datetime"
            placeholder="选择开始时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="formData.endTime"
            type="datetime"
            placeholder="选择结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 其他 -->
        <h4 class="form-section-title">其他</h4>

        <el-form-item label="是否启用">
          <el-switch v-model="formData.isActive" active-text="启用" inactive-text="停用" />
        </el-form-item>

        <el-form-item label="优惠券描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="可选，描述优惠券使用规则或说明"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEditing ? '保存修改' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * CouponManage 优惠券管理组件
 *
 * @description 管理后台优惠券列表页，支持分页、搜索、创建、编辑、启用/禁用、删除
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import {
  getCouponList,
  createCoupon,
  updateCoupon,
  toggleCouponActive,
  deleteCoupon,
} from '../../api/coupon';

// ================================================================
// 类型定义
// ================================================================

/** 优惠券数据接口 */
interface CouponItem {
  id: number;
  name: string;
  code: string;
  type: 'fixed' | 'percentage';
  discount: number;
  minAmount: number;
  maxDiscount: number | null;
  totalCount: number;
  perUserLimit: number;
  remainingCount: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
  _toggling?: boolean;
}

/** 查询参数接口 */
interface QueryParams {
  page: number;
  pageSize: number;
  name?: string;
  code?: string;
  type?: string;
  isActive?: boolean | '';
}

/** 表单数据接口 */
interface FormData {
  name: string;
  code: string;
  type: 'fixed' | 'percentage';
  discount: number;
  minAmount: number;
  maxDiscount: number | null;
  totalCount: number;
  perUserLimit: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  description: string;
}

// ================================================================
// 响应式数据
// ================================================================

const loading = ref(false);
const submitting = ref(false);
const couponList = ref<CouponItem[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<any>(null);

/** 查询参数 */
const queryParams = reactive<QueryParams>({
  page: 1,
  pageSize: 20,
  name: '',
  code: '',
  type: '',
  isActive: '',
});

/** 表单默认值 */
const defaultFormData: FormData = {
  name: '',
  code: '',
  type: 'fixed',
  discount: 1000,
  minAmount: 0,
  maxDiscount: null,
  totalCount: -1,
  perUserLimit: 1,
  startTime: '',
  endTime: '',
  isActive: true,
  description: '',
};

/** 表单数据 */
const formData = reactive<FormData>({ ...defaultFormData });

// ================================================================
// 表单校验规则
// ================================================================

const formRules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入优惠券码', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_-]+$/, message: '优惠券码只能包含字母、数字、下划线和连字符', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择优惠券类型', trigger: 'change' }],
  discount: [{ required: true, message: '请输入优惠面值', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
};

// ================================================================
// 方法
// ================================================================

/**
 * 格式化日期时间
 * @param dateStr 日期字符串
 * @returns 格式化后的日期字符串
 */
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * 获取优惠券列表
 */
const fetchCouponList = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: queryParams.page,
      pageSize: queryParams.pageSize,
    };
    if (queryParams.name) params.name = queryParams.name;
    if (queryParams.code) params.code = queryParams.code;
    if (queryParams.type) params.type = queryParams.type;
    if (queryParams.isActive !== '') params.isActive = queryParams.isActive;

    const result = await getCouponList(params);
    couponList.value = result.items || [];
    total.value = result.meta?.total || 0;
  } catch (error) {
    console.error('获取优惠券列表失败:', error);
    couponList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

/**
 * 搜索
 */
const handleSearch = () => {
  queryParams.page = 1;
  fetchCouponList();
};

/**
 * 重置搜索条件
 */
const resetSearch = () => {
  queryParams.name = '';
  queryParams.code = '';
  queryParams.type = '';
  queryParams.isActive = '';
  queryParams.page = 1;
  fetchCouponList();
};

/**
 * 打开创建弹窗
 */
const openCreateDialog = () => {
  isEditing.value = false;
  editingId.value = null;
  Object.assign(formData, { ...defaultFormData });
  dialogVisible.value = true;
};

/**
 * 打开编辑弹窗
 * @param row 优惠券数据
 */
const openEditDialog = (row: CouponItem) => {
  isEditing.value = true;
  editingId.value = row.id;
  Object.assign(formData, {
    name: row.name,
    code: row.code,
    type: row.type,
    discount: row.discount,
    minAmount: row.minAmount,
    maxDiscount: row.maxDiscount,
    totalCount: row.totalCount,
    perUserLimit: row.perUserLimit,
    startTime: row.startTime,
    endTime: row.endTime,
    isActive: row.isActive,
    description: row.description || '',
  });
  dialogVisible.value = true;
};

/**
 * 重置表单
 */
const resetForm = () => {
  formRef.value?.resetFields();
};

/**
 * 提交表单（创建或更新）
 */
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    // 校验：开始时间不能晚于结束时间
    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      ElMessage.warning('开始时间不能晚于或等于结束时间');
      return;
    }

    // 准备提交数据
    const submitData: any = {
      name: formData.name,
      code: formData.code,
      type: formData.type,
      discount: formData.discount,
      minAmount: formData.minAmount || 0,
      totalCount: formData.totalCount,
      perUserLimit: formData.perUserLimit ?? 1,
      startTime: formData.startTime,
      endTime: formData.endTime,
      isActive: formData.isActive,
      description: formData.description || undefined,
    };

    // 折扣券增加 maxDiscount 参数
    if (formData.type === 'percentage' && formData.maxDiscount) {
      submitData.maxDiscount = formData.maxDiscount;
    }

    if (isEditing.value && editingId.value) {
      await updateCoupon(editingId.value, submitData);
      ElMessage.success('优惠券更新成功');
    } else {
      await createCoupon(submitData);
      ElMessage.success('优惠券创建成功');
    }

    dialogVisible.value = false;
    fetchCouponList();
  } catch (error: any) {
    // 后端错误已由 axios 拦截器处理
    console.error('提交失败:', error);
  } finally {
    submitting.value = false;
  }
};

/**
 * 启用/禁用切换
 * @param row 优惠券数据
 * @param isActive 是否启用
 */
const handleToggleActive = async (row: CouponItem, isActive: boolean) => {
  row._toggling = true;
  try {
    await toggleCouponActive(row.id, isActive);
    row.isActive = isActive;
    ElMessage.success(isActive ? '优惠券已启用' : '优惠券已停用');
  } catch (error) {
    console.error('切换状态失败:', error);
  } finally {
    row._toggling = false;
  }
};

/**
 * 删除优惠券
 * @param row 优惠券数据
 */
const handleDelete = async (row: CouponItem) => {
  try {
    await deleteCoupon(row.id);
    ElMessage.success('优惠券已删除');
    fetchCouponList();
  } catch (error) {
    console.error('删除失败:', error);
  }
};

// ================================================================
// 生命周期
// ================================================================

onMounted(() => {
  fetchCouponList();
});
</script>

<style scoped>
/* ============================================================
 * CouponManage 样式
 * ============================================================ */

.coupon-manage {
  padding: 1rem 0;
}

/* ---- 页面头部 ---- */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0;
}

/* ---- 搜索区域 ---- */
.filter-section {
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

/* ---- 表格区域 ---- */
.table-section {
  background-color: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  padding: 1rem;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

/* ---- 表单 ---- */
.form-section-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--va-on-background-secondary);
  text-transform: uppercase;
  letter-spacing: 0.0375rem;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.375rem;
  border-bottom: 1px solid var(--va-background-element);
}

.form-unit {
  margin-left: 0.5rem;
  font-size: 0.8125rem;
  color: var(--va-muted);
}

.form-tip {
  font-size: 0.75rem;
  color: var(--va-muted);
  margin-top: 0.25rem;
}

/* ---- 文字辅助类 ---- */
.text-sm {
  font-size: 0.8125rem;
}

.text-danger {
  color: var(--va-danger);
}

/* ---- 覆盖 Element Plus 样式 ---- */
:deep(.el-dialog__body) {
  padding: 1.25rem 1.5rem;
}

:deep(.el-table th.el-table__cell) {
  background-color: var(--va-background-secondary);
  font-size: 0.8125rem;
  font-weight: 600;
}

:deep(.el-switch__label) {
  font-size: 0.75rem;
}
</style>
