import { get, post, del } from './request';

/**
 * 购物车 API
 * 功能描述：封装购物车相关的 HTTP 接口调用
 */

/**
 * 获取购物车列表
 * @returns 购物车项列表（含课程详细信息）
 */
export function getCart() {
  return get<any[]>('/cart');
}

/**
 * 获取购物车数量
 * @returns 购物车中的课程数量
 */
export function getCartCount() {
  return get<{ count: number }>('/cart/count');
}

/**
 * 添加课程到购物车
 * @param courseId 课程ID
 * @param quantity 数量（默认1）
 * @returns 购物车项
 */
export function addToCart(courseId: number, quantity?: number) {
  return post<any>('/cart/add', { courseId, quantity });
}

/**
 * 从购物车移除课程
 * @param courseId 课程ID
 */
export function removeFromCart(courseId: number) {
  return del(`/cart/remove/${courseId}`);
}

/**
 * 清空购物车
 */
export function clearCart() {
  return post<any>('/cart/clear');
}
