/**
 * 支付 API
 * 功能描述：封装支付宝支付相关的 HTTP 接口调用
 */
import { get, post } from './request';

/**
 * 创建支付宝支付
 * @param orderId 订单ID
 * @returns 支付跳转链接 { payUrl: string }
 */
export function createPayment(orderId: number) {
  return post<{ payUrl: string }>('/payments/create', { orderId });
}

/**
 * 查询支付状态
 * @param orderNo 订单号
 * @returns 支付状态 { status: string, tradeNo?: string }
 */
export function queryPaymentStatus(orderNo: string) {
  return get<{ status: string; tradeNo?: string }>(`/payments/query/${orderNo}`);
}

/**
 * 手动确认支付（备用方案）
 * @param orderNo 订单号
 * @returns 更新后的订单
 */
export function confirmPayment(orderNo: string) {
  return post<any>('/payments/confirm', { orderNo });
}

/**
 * 管理端：退款处理（调用支付宝退款API）
 * @param id 订单ID
 * @param remark 退款备注
 * @returns 退款结果
 */
export function refundOrderWithAlipay(id: number, remark?: string) {
  return post<any>(`/admin/orders/${id}/refund`, { remark });
}
