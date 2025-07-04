import api from '../api';
import tokenManager from './tokenManager';

/**
 * 用户名密码认证服务
 * 处理基于用户名和密码的认证相关功能
 */
export const passwordAuth = {
    /**
     * 用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise} - API响应
     */
    login: async (username, password) => {
        const response = await api.post('/auth/sessions/', { username, password });
        tokenManager.saveAuthResponse(response);
        return response;
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

};

export default passwordAuth; 