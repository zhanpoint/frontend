import api from './api';
import { auth } from './api';

/**
 * 认证服务 - 核心功能
 */
const authService = {
    /**
     * 用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     */
    login: async (username, password) => {
        const response = await api.post('/auth/login/', { username, password });

        // 保存令牌和用户信息
        if (response.data.code === 200) {
            const { access, refresh, data } = response.data;
            if (access && refresh) {
                localStorage.setItem('accessToken', access);
                localStorage.setItem('refreshToken', refresh);
            }

            if (data) localStorage.setItem('user', JSON.stringify(data));
        }

        return response;
    },

    /**
     * 用户注销
     */
    logout: () => auth.logout(),

    /**
     * 检查用户是否已认证
     */
    isAuthenticated: () => auth.isAuthenticated(),

    /**
     * 获取当前用户信息
     */
    getCurrentUser: () => auth.getCurrentUser(),

    /**
     * 更新用户信息
     * @param {Object} userData - 用户数据
     */
    updateUserProfile: async (userData) => {
        const response = await api.put('/auth/profile/', userData);

        if (response.data.code === 200 && response.data.data) {
            localStorage.setItem('user', JSON.stringify(response.data.data));
        }

        return response;
    },

    /**
     * 刷新用户令牌
     * 通常由api.js中的拦截器自动处理
     * 此方法用于手动刷新令牌的情况
     * @returns {Promise<string>} - 新的访问令牌
     */
    refreshToken: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('没有刷新令牌可用');
        }

        try {
            const response = await api.post('/auth/token/refresh/', {
                refresh: refreshToken
            });

            if (response.data && response.data.access) {
                localStorage.setItem('accessToken', response.data.access);
                return response.data.access;
            } else {
                throw new Error('无效的响应格式');
            }
        } catch (error) {
            console.error('刷新令牌失败:', error);

            // 如果刷新令牌也过期，清除所有令牌并通知用户重新登录
            if (error.response && (error.response.status === 401 || error.response.status === 400)) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');

                // 触发重新登录事件
                if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('auth:required'));
                }
            }
            throw error;
        }
    },

    /**
     * 更改密码
     * @param {string} oldPassword - 当前密码
     * @param {string} newPassword - 新密码
     * @returns {Promise} - API响应
     */
    changePassword: async (oldPassword, newPassword) => {
        return api.post('/auth/change-password/', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    /**
     * 发送密码重置邮件
     * @param {string} email - 用户邮箱
     * @returns {Promise} - API响应
     */
    resetPasswordRequest: async (email) => {
        return api.post('/auth/reset-password-request/', { email });
    },

    /**
     * 重置密码
     * @param {string} token - 重置令牌
     * @param {string} newPassword - 新密码
     * @returns {Promise} - API响应
     */
    resetPassword: async (token, newPassword) => {
        return api.post('/auth/reset-password/', {
            token,
            new_password: newPassword
        });
    }
};

export default authService; 