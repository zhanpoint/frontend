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
     * 使用验证码注册用户
     * @param {string} username - 用户名 
     * @param {string} password - 密码
     * @param {string} phone - 手机号
     * @param {string} verificationCode - 验证码
     * @returns {Promise} - API响应
     */
    registerWithCode: (username, password, phone, verificationCode) => {
        return api.post('/auth/register-with-code/', {
            username,
            password,
            phone_number: phone,
            code: verificationCode
        });
    }
};

export default smsService; 