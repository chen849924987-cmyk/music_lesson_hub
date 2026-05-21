import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';

/**
 * 路由配置
 * 功能描述：定义应用的所有路由，包括三端（制作人端、教师端、管理端）的路由分离
 *
 * 术语说明："制作人"替代旧版"学员/学生"——面向音乐制作人的学习平台
 */

// 路由配置表
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/dashboard/HomePage.vue'),
    meta: { title: 'SoundCraft - 首页' },
  },
  // ============ 认证相关 ============
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('../views/auth/LoginPage.vue'),
        meta: { title: '登录', guest: true },
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('../views/auth/RegisterPage.vue'),
        meta: { title: '注册', guest: true },
      },
    ],
  },
  // ============ 公开课程中心（无需登录） ============
  {
    path: '/courses',
    name: 'Courses',
    component: () => import('../views/dashboard/CourseCatalog.vue'),
    meta: { title: '课程中心' },
  },
  {
    path: '/courses/:id',
    name: 'CourseDetail',
    component: () => import('../views/dashboard/CourseDetailPublic.vue'),
    meta: { title: '课程详情' },
  },
  // ============ 制作人端（原学员端） ============
  {
    path: '/producer',
    name: 'ProducerLayout',
    component: () => import('../layouts/ProducerLayout.vue'),
    meta: { requiresAuth: true, role: 'producer' },
    redirect: '/producer/my-courses',
    children: [
      {
        path: 'my-courses',
        name: 'ProducerMyCourses',
        component: () => import('../views/dashboard/ProducerMyCourses.vue'),
        meta: { title: '我的课程' },
      },
      {
        path: 'orders',
        name: 'ProducerOrders',
        component: () => import('../views/dashboard/MyOrders.vue'),
        meta: { title: '我的订单' },
      },
      {
        path: 'cart',
        name: 'ProducerCart',
        component: () => import('../views/dashboard/Cart.vue'),
        meta: { title: '购物车' },
      },
      {
        path: 'profile',
        name: 'ProducerProfile',
        component: () => import('../views/dashboard/ProfilePage.vue'),
        meta: { title: '个人中心' },
      },
    ],
  },

  // ============ 购物车结算 / 订单确认（独立全屏，无侧边栏） ============
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('../views/dashboard/Checkout.vue'),
    meta: { title: '确认订单', requiresAuth: true },
  },

  // ============ 支付成功页（支付宝同步跳转） ============
  {
    path: '/payment/success',
    name: 'PaymentSuccess',
    component: () => import('../views/dashboard/PaymentSuccess.vue'),
    meta: { title: '支付成功' },
  },

  // ============ 课程学习/播放（独立全屏布局，无侧边栏） ============
  {
    path: '/producer/courses/:id',
    name: 'CoursePlayer',
    component: () => import('../views/dashboard/CoursePlayer.vue'),
    meta: { title: '课程学习', requiresAuth: true },
  },

  // ============ 教师端 ============
  {
    path: '/teacher',
    name: 'TeacherLayout',
    component: () => import('../layouts/TeacherLayout.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
    redirect: '/teacher/dashboard',
    children: [
      {
        path: 'courses',
        name: 'TeacherCourses',
        component: () => import('../views/dashboard/TeacherCourses.vue'),
        meta: { title: '课程管理' },
      },
      {
        path: 'courses/create',
        name: 'CourseCreatePage',
        component: () => import('../views/dashboard/CourseCreatePage.vue'),
        meta: { title: '创建课程' },
      },
      {
        path: 'courses/create/single',
        name: 'CourseCreateSingle',
        component: () => import('../views/dashboard/CourseCreateSingle.vue'),
        meta: { title: '创建单课程' },
      },
      {
        path: 'courses/create/series',
        name: 'CourseCreateSeries',
        component: () => import('../views/dashboard/CourseCreateSeries.vue'),
        meta: { title: '创建系列课程' },
      },
      {
        path: 'courses/:id/edit',
        name: 'CourseEdit',
        component: () => import('../views/dashboard/CourseEdit.vue'),
        meta: { title: '编辑课程' },
      },
      // ============ v2.8 新增路由 ============
      {
        path: 'dashboard',
        name: 'TeacherDashboard',
        component: () => import('../views/dashboard/TeacherDashboard.vue'),
        meta: { title: '教师控制台' },
      },
      {
        path: 'producers',
        name: 'TeacherProducers',
        component: () => import('../views/dashboard/TeacherProducers.vue'),
        meta: { title: '制作人管理' },
      },
      {
        path: 'earnings',
        name: 'TeacherEarnings',
        component: () => import('../views/dashboard/TeacherEarnings.vue'),
        meta: { title: '收益中心' },
      },
      {
        path: 'earnings/withdrawals',
        name: 'TeacherWithdrawals',
        component: () => import('../views/dashboard/TeacherWithdrawals.vue'),
        meta: { title: '提现记录' },
      },
      {
        path: 'profile',
        name: 'TeacherProfile',
        component: () => import('../views/dashboard/ProfilePage.vue'),
        meta: { title: '个人中心' },
      },
    ],
  },
  // ============ 管理端 ============
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/dashboard/AdminDashboard.vue'),
        meta: { title: '控制台' },
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/dashboard/AdminUsers.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'teachers',
        name: 'AdminTeachers',
        component: () => import('../views/dashboard/AdminTeachers.vue'),
        meta: { title: '教师管理' },
      },
      {
        path: 'courses',
        name: 'AdminCourseList',
        component: () => import('../views/dashboard/AdminCourseList.vue'),
        meta: { title: '课程列表' },
      },
      {
        path: 'courses/review',
        name: 'CourseReview',
        component: () => import('../views/dashboard/CourseReview.vue'),
        meta: { title: '课程审核' },
      },
      {
        path: 'attachments/review',
        name: 'AttachmentReview',
        component: () => import('../views/dashboard/AttachmentReviewPage.vue'),
        meta: { title: '附件审核' },
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('../views/dashboard/OrderManage.vue'),
        meta: { title: '订单管理' },
      },
      {
        path: 'coupons',
        name: 'AdminCoupons',
        component: () => import('../views/dashboard/CouponManage.vue'),
        meta: { title: '优惠券管理' },
      },
      {
        path: 'earnings',
        name: 'AdminEarnings',
        component: () => import('../views/dashboard/AdminEarnings.vue'),
        meta: { title: '收益看板', requiresAuth: true, role: 'admin' },
      },
      {
        path: 'withdrawals',
        name: 'AdminWithdrawals',
        component: () => import('../views/dashboard/AdminWithdrawals.vue'),
        meta: { title: '提现审核', requiresAuth: true, role: 'admin' },
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: () => import('../views/dashboard/ProfilePage.vue'),
        meta: { title: '个人中心' },
      },
    ],
  },
  // ============ 404 ============
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/dashboard/NotFound.vue'),
    meta: { title: '404' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  /**
   * 滚动行为：不处理 hash 锚点滚动（由目标组件在数据加载完成后自行处理）
   * 避免因懒加载组件未渲染导致 scrollBehavior 找不到 DOM 元素而失效。
   * 首页 /home 的 #about / #courses 锚点滚动由 HomePage.vue 在 onMounted 完成后执行。
   */
  scrollBehavior(to) {
    if (to.hash) {
      // 不执行任何滚动，交给组件处理
      return false;
    }
    // 默认滚动到顶部
    return { top: 0 };
  },
});

// ============ 路由守卫 ============
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || 'SoundCraft'} - SoundCraft`;

  // 检查是否需要认证
  const requiresAuth = to.meta.requiresAuth;
  const authStore = useAuthStore();

  if (requiresAuth && !authStore.isLoggedIn) {
    // 未登录，跳转登录页
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }

  // 检查角色权限
  const requiredRole = to.meta.role as string | undefined;
  if (requiredRole && authStore.isLoggedIn) {
    if (requiredRole === 'admin' && !authStore.isAdmin && !authStore.isSuperAdmin) {
      // 非管理员访问管理端
      next({ name: 'Home' });
      return;
    }
    if (requiredRole === 'teacher' && !authStore.isTeacher) {
      // 非教师访问教师端
      next({ name: 'Home' });
      return;
    }
    if (requiredRole === 'producer' && !authStore.isProducer) {
      // 非制作人访问制作人端
      next({ name: 'Home' });
      return;
    }
  }

  // 已登录用户访问登录页，跳转首页
  if (to.meta.guest && authStore.isLoggedIn) {
    next({ name: 'Home' });
    return;
  }

  next();
});

export default router;
