import api from './api';

/**
 * 短信服务相关API
 */
export const smsService = {
    /**
     * 发送短信验证码
     * @param {string} phone - 手机号
     * @returns {Promise} - API响应
     */
    sendVerificationCode: (phone) => {
        return api.post('/sms/send-verification-code/', { phone });
    },

    /**
     * 验证短信验证码
     * @param {string} phone - 手机号
     * @param {string} code - 验证码
     * @returns {Promise} - API响应
     */
    verifyCode: (phone, code) => {
        return api.post('/sms/verify-code/', { phone, code });
    }
};

export default smsService; 