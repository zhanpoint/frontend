import api from '../api';
import tokenManager from './tokenManager';

/**
 * 短信验证码认证服务
 * 处理基于短信验证码的认证相关功能
 */
export const smsAuth = {
    /**
     * 使用短信验证码登录
     * @param {string} phone - 手机号 
     * @param {string} code - 验证码
     * @returns {Promise} - API响应
     */
    loginWithCode: async (phone, code) => {
        const response = await api.post('/auth/sessions/', {
            phone_number: phone,
            code
        });

        tokenManager.saveAuthResponse(response);
        return response;
    },

    /**
     * 使用短信验证码注册
     * @param {string} username - 用户名 
     * @param {string} password - 密码
     * @param {string} phone - 手机号
     * @param {string} verificationCode - 验证码
     * @returns {Promise} - API响应
     */
    registerWithCode: async (username, password, phone, verificationCode) => {
        const response = await api.post('/users/', {
            username,
            password,
            phone_number: phone,
            code: verificationCode
        });

        // 如果注册同时登录，保存令牌和用户数据
        tokenManager.saveAuthResponse(response);
        return response;
    }
};

export default smsAuth;
