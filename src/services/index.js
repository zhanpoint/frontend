import api from './api';
import auth from './auth';
import notificationService from './notification';

// 导出API实例
export { api };

// 导出认证服务
export { auth };

// 导出通知服务
export { notificationService };

// 为了方便使用，也单独导出短信服务
export const sms = notificationService.sms;

// 默认导出所有服务
export default {
    api,
    auth,
    notification: notificationService,
    sms
}; 