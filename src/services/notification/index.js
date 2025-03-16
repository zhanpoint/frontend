import smsService from './sms';
// 未来可能添加的其他通知服务
// import emailService from './email';
// import pushService from './push';

/**
 * 统一通知服务
 * 整合所有通知相关功能
 */
export const notificationService = {
    // 短信通知服务
    sms: smsService,

    // 未来可能添加的其他通知服务
    // email: emailService,
    // push: pushService
};

export default notificationService; 