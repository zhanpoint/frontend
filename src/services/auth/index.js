import api from '../api';
import tokenManager from './tokenManager';
import passwordAuth from './passwordAuth';
import smsAuth from './smsAuth';
import profileManager from './profileManager';
import { toast } from 'sonner';

/**
 * 统一认证服务
 * 整合所有认证相关功能
 */
export const auth = {
    /**
     * 检查用户是否已认证
     * @returns {boolean} 认证状态
     */
    isAuthenticated: () => !!tokenManager.getAccessToken(),

    /**
     * 获取当前用户信息
     * @returns {Object|null} 用户数据
     */
    getCurrentUser: () => tokenManager.getUserData(),

    /**
     * 用户注销
     * @returns {Promise} 注销操作的Promise
     */
    logout: async () => {
        try {
            // 获取当前token，用于在API请求头中使用
            const accesstoken = tokenManager.getAccessToken();
            const refreshToken = tokenManager.getRefreshToken();
            if (accesstoken) {
                // 向后端发送注销请求，使当前token失效
                await api.delete('/auth/sessions/', { refresh: refreshToken }, {
                    headers: {
                        Authorization: `Bearer ${accesstoken}`
                    }
                });
            }
        } catch (error) {
            console.error('退出登录请求失败:', error);
            // 即使API请求失败，也继续执行本地注销流程
        } finally {
            // 无论API是否成功，都清除本地状态
            tokenManager.clearTokens();
            tokenManager.clearUserData();
            // 触发登出事件
            window.dispatchEvent(new CustomEvent('auth:logout'));
            toast.success('已成功退出登录');
            // 重定向到首页，延长延迟时间确保提示消息能够显示
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    },

    /**
     * 刷新访问令牌
     * @returns {Promise<string>} 新的访问令牌
     */
    refreshToken: async () => {
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) {
            throw new Error('没有刷新令牌可用');
        }

        try {
            const response = await api.post('/auth/tokens/refresh/', {
                refresh: refreshToken
            });

            if (response.data && response.data.access) {
                tokenManager.setTokens(response.data.access, null);
                return response.data.access;
            } else {
                throw new Error('无效的响应格式');
            }
        } catch (error) {
            console.error('刷新令牌失败:', error);

            if (error.response && (error.response.status === 401 || error.response.status === 400)) {
                auth.logout();
                window.dispatchEvent(new CustomEvent('auth:required'));
            }
            throw error;
        }
    },

    // 从令牌管理器导出方法
    ...tokenManager,

    // 从密码认证服务导出方法
    ...passwordAuth,

    // 从短信认证服务导出方法
    ...smsAuth,

    // 从用户资料管理服务导出方法
    ...profileManager
};

// 默认导出
export default auth;

// 认证服务统一导出
export { default as passwordAuth } from './passwordAuth';
export { default as passwordReset } from './passwordReset';
export { default as profileManager } from './profileManager';
export { default as smsAuth } from './smsAuth';
export { default as emailAuth } from './emailAuth';
export { default as tokenManager } from './tokenManager'; 