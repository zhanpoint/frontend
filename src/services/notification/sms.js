import api from '../api';

/**
 * 短信通知服务
 * 负责短信发送相关功能
 */
export const smsService = {
    /**
     * 发送短信验证码
     * @param {string} phone - 手机号
     * @param {string} scene - 短信场景 ('register', 'login', 'reset_password')
     * @returns {Promise} - API响应
     */
    sendVerificationCode: (phone, scene = 'register') => {
        return api.post('/sms/send-verification-code/', { phone, scene });
    },

    /**
     * 发送通知短信
     * @param {string} phone - 手机号
     * @param {string} templateId - 模板ID
     * @param {Object} params - 模板参数
     * @returns {Promise} - API响应
     */
    sendNotification: (phone, templateId, params = {}) => {
        return api.post('/sms/send-notification/', {
            phone,
            template_id: templateId,
            params
        });
    },

    /**
     * 发送营销短信
     * @param {string} phone - 手机号
     * @param {string} content - 短信内容
     * @returns {Promise} - API响应
     */
    sendMarketing: (phone, content) => {
        return api.post('/sms/send-marketing/', {
            phone,
            content
        });
    }
};

export default smsService; 