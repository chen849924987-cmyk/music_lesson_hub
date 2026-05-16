import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';

// 定义统一响应格式
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

/**
 * 创建 Axios 实例
 * 功能描述：封装 HTTP 请求，统一处理错误和 Token 注入
 */
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ 请求拦截器 ============
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 Token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ============ 响应拦截器 ============
service.interceptors.response.use(
  (response) => {
    const res: ApiResponse = response.data;

    // 根据后端统一响应格式判断请求是否成功
    if (res.code !== 200 && res.code !== 201) {
      ElMessage.error(res.message || '请求失败');

      // 401 未授权，跳转登录页
      if (res.code === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userInfo');
        window.location.href = '/auth/login';
      }

      return Promise.reject(new Error(res.message));
    }

    return res.data;
  },
  (error) => {
    // 处理 HTTP 错误状态码
    if (error.response) {
      const { status } = error.response;
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userInfo');
          window.location.href = '/auth/login';
          break;
        case 403:
          ElMessage.error('没有权限访问');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器内部错误');
          break;
        default:
          ElMessage.error(error.response.data?.message || '请求失败');
      }
    } else if (error.message.includes('timeout')) {
      ElMessage.error('请求超时，请稍后重试');
    } else {
      ElMessage.error('网络错误，请检查网络连接');
    }

    return Promise.reject(error);
  },
);

/**
 * 封装 GET 请求
 */
export function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return service.get(url, config);
}

/**
 * 封装 POST 请求
 */
export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return service.post(url, data, config);
}

/**
 * 封装 PUT 请求
 */
export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return service.put(url, data, config);
}

/**
 * 封装 PATCH 请求
 */
export function patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return service.patch(url, data, config);
}

/**
 * 封装 DELETE 请求
 */
export function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return service.delete(url, config);
}

export default service;
