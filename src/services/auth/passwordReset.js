import api from '../api';

/**
 * 密码重置服务
 * 处理用户密码重置相关功能
 */
const passwordReset = {
    /**
     * 发送重置密码验证码
     * @param {string} phone - 手机号
     * @returns {Promise} - API响应
     */
    sendResetCode: (phone) => {
        return api.post('/sms/send-verification-code/', { phone });
    },

    /**
     * 重置密码
     * @param {string} phone - 手机号
     * @param {string} code - 验证码
     * @param {string} newPassword - 新密码
     * @returns {Promise} - API响应
     */
    resetPassword: (phone, code, newPassword) => {
        return api.post('/auth/reset-password/', {
            phone,
            code,
            newPassword
        });
    }
};

export default passwordReset; 