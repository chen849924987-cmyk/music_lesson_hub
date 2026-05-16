import { get, post, del } from './request';

/**
 * 订单 & 购物车 API
 * 功能描述：封装订单和购物车相关的 HTTP 接口调用
 */

// ================================================================
// 订单接口
// ================================================================

/**
 * 创建订单
 * @param courseIds 课程ID列表（从购物车结算或直接购买）
 * @param lessonIds 课时ID列表（系列课课时单独购买）
 * @returns 订单对象
 */
export function createOrder(params: { courseIds?: number[]; lessonIds?: number[] }) {
  return post<any>('/orders/create', params);
}

/**
 * 获取我的订单列表
 * @param params 查询参数（page/pageSize/status）
 * @returns 分页订单列表
 */
export function getMyOrders(params?: { page?: number; pageSize?: number; status?: string }) {
  return get<any>('/orders/my', { params });
}

/**
 * 获取订单详情
 * @param id 订单ID
 * @returns 订单详情
 */
export function getOrderDetail(id: number) {
  return get<any>(`/orders/${id}`);
}

/**
 * 取消订单
 * @param id 订单ID
 * @returns 取消后的订单
 */
export function cancelOrder(id: number) {
  return post<any>(`/orders/${id}/cancel`);
}

/**
 * 管理端：获取所有订单列表
 * @param params 查询参数
 * @returns 分页订单列表
 */
export function getAllOrders(params?: { page?: number; pageSize?: number; status?: string; userId?: number }) {
  return get<any>('/admin/orders', { params });
}

/**
 * 管理端：退款处理
 * @param id 订单ID
 * @param remark 退款备注
 */
export function refundOrder(id: number, remark?: string) {
  return post<any>(`/admin/orders/${id}/refund`, { remark });
}

/**
 * 检查订单购买状态
 * @param courseId 课程ID
 * @returns 是否已购买
 */
export function checkPurchaseStatus(courseId: number) {
  return get<{ purchased: boolean }>(`/orders/check-purchase/${courseId}`);
}
