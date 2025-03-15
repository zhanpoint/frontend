import axios from 'axios';
import { toast } from "sonner";

// 创建Axios实例
const api = axios.create({
    // 根据实际部署环境设置baseURL
    baseURL: import.meta.env.MODE === 'production'
        ? 'https://yourdomain.com/api' // 生产环境API地址
        : 'http://localhost:8412/api',  // 开发环境API地址

    // 请求超时时间
    timeout: 10000,

    // 请求头
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, error => Promise.reject(error));

// 响应拦截器 - 处理令牌刷新
api.interceptors.response.use(response => response, async error => {
    const originalRequest = error.config;

    // 只处理401错误且非令牌刷新请求
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
            // 尝试刷新令牌
            const token = localStorage.getItem('refreshToken');
            if (!token) throw new Error('无刷新令牌');

            const response = await axios.post('/api/token/refresh/', { refresh: token });
            const newToken = response.data.access;

            // 保存新令牌
            localStorage.setItem('accessToken', newToken);

            // 更新请求头并重试
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            // 刷新失败，清除令牌并通知用户重新登录
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            // 显示通知提示用户需要重新登录
            toast.error('登录已过期，请重新登录', {
                duration: 5000,
                id: 'auth-expired'  // 避免多次显示相同提示
            });

            // 触发认证事件
            window.dispatchEvent(new CustomEvent('auth:required'));

            return Promise.reject(refreshError);
        }
    }

    // 处理其他常见错误
    if (error.response) {
        // 服务器返回了错误状态码
        switch (error.response.status) {
            case 403:
                toast.error('没有权限执行此操作', { id: 'error-403' });
                break;
            case 404:
                toast.error('请求的资源不存在', { id: 'error-404' });
                break;
            case 500:
                toast.error('服务器内部错误，请稍后再试', { id: 'error-500' });
                break;
            default:
                // 其他错误状态不主动显示，由调用方处理
                break;
        }
    } else if (error.request) {
        // 请求发出，但没有收到响应
        toast.error('网络错误，无法连接到服务器', { id: 'network-error' });
    }

    return Promise.reject(error);
});

// 认证工具
export const auth = {
    // 登出
    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        toast.success('已成功退出登录');
    },

    // 检查认证状态
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    },

    // 获取用户信息
    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('user') || null);
        } catch {
            return null;
        }
    }
};

export default api; 