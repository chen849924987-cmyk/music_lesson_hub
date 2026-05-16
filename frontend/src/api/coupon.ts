import { get, post, put, del } from './request';

/**
 * 优惠券 API
 * 功能描述：封装优惠券相关的 HTTP 接口调用，包括管理端 CRUD 和用户端领取使用
 */

// ================================================================
// 管理端：优惠券 CRUD
// ================================================================

/**
 * 创建优惠券
 * @param data 优惠券创建参数
 * @returns 创建的优惠券对象
 */
export function createCoupon(data: any) {
  return post<any>('/admin/coupons', data);
}

/**
 * 分页查询优惠券列表
 * @param params 查询参数（page/pageSize/name/code/type/isActive）
 * @returns 分页优惠券列表
 */
export function getCouponList(params?: any) {
  return get<any>('/admin/coupons', { params });
}

/**
 * 查询优惠券详情
 * @param id 优惠券ID
 * @returns 优惠券详情
 */
export function getCouponDetail(id: number) {
  return get<any>(`/admin/coupons/${id}`);
}

/**
 * 更新优惠券
 * @param id 优惠券ID
 * @param data 更新参数
 * @returns 更新后的优惠券
 */
export function updateCoupon(id: number, data: any) {
  return put<any>(`/admin/coupons/${id}`, data);
}

/**
 * 启用/禁用优惠券
 * @param id 优惠券ID
 * @param isActive 是否启用
 * @returns 更新后的优惠券
 */
export function toggleCouponActive(id: number, isActive: boolean) {
  return post<any>(`/admin/coupons/${id}/toggle-active`, { isActive });
}

/**
 * 删除优惠券
 * @param id 优惠券ID
 */
export function deleteCoupon(id: number) {
  return del<any>(`/admin/coupons/${id}`);
}

/**
 * 获取优惠券统计数据
 * @param couponId 优惠券ID（可选）
 * @returns 统计信息
 */
export function getCouponStats(couponId?: number) {
  return get<any>('/admin/coupons/stats/all', { params: { couponId } });
}

// ================================================================
// 用户端：优惠券领取与使用
// ================================================================

/**
 * 用户领取优惠券
 * @param code 优惠券码
 * @returns 用户优惠券记录
 */
export function claimCoupon(code: string) {
  return post<any>('/coupons/claim', { code });
}

/**
 * 获取用户可用优惠券列表
 * @returns 可用优惠券列表
 */
export function getAvailableCoupons() {
  return get<any>('/coupons/available');
}

/**
 * 获取用户全部优惠券
 * @returns 用户所有优惠券
 */
export function getMyCoupons() {
  return get<any>('/coupons/my');
}

/**
 * 计算优惠券折扣
 * @param userCouponId 用户优惠券记录ID
 * @param orderAmount 订单金额（单位：分）
 * @returns 优惠计算结果
 */
export function calculateCouponDiscount(userCouponId: number, orderAmount: number) {
  return post<any>('/coupons/calculate', { userCouponId, orderAmount });
}
