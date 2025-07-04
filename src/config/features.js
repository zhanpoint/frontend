/**
 * 前端功能开关配置
 * 用于控制各种功能的启用/禁用状态
 */

// 默认的功能开关配置（后备配置）
const DEFAULT_FEATURE_FLAGS = {
    // 短信服务开关 - 控制短信登录、注册、重置密码功能
    SMS_SERVICE_ENABLED: false,

    // 邮件服务开关 - 控制邮箱登录、注册、重置密码功能
    EMAIL_SERVICE_ENABLED: true,

    // 密码登录开关
    PASSWORD_LOGIN_ENABLED: true,
};

// 运行时功能开关配置（从后端获取）
let RUNTIME_FEATURE_FLAGS = { ...DEFAULT_FEATURE_FLAGS };

/**
 * 从后端获取功能开关配置
 * @returns {Promise<Object>} - 功能开关配置
 */
export const fetchFeatureFlags = async () => {
    try {
        const response = await fetch('/api/system/features/');
        if (response.ok) {
            const result = await response.json();
            if (result.code === 200 && result.data) {
                RUNTIME_FEATURE_FLAGS = { ...DEFAULT_FEATURE_FLAGS, ...result.data };
                return RUNTIME_FEATURE_FLAGS;
            }
        }
    } catch (error) {
        console.warn('获取功能开关配置失败，使用默认配置:', error);
    }

    // 获取失败时使用默认配置
    RUNTIME_FEATURE_FLAGS = { ...DEFAULT_FEATURE_FLAGS };
    return RUNTIME_FEATURE_FLAGS;
};

/**
 * 获取当前功能开关配置
 * @returns {Object} - 当前功能开关配置
 */
export const getFeatureFlags = () => {
    return RUNTIME_FEATURE_FLAGS;
};

/**
 * 检查功能是否启用
 * @param {string} feature - 功能名称
 * @returns {boolean} - 是否启用
 */
export const isFeatureEnabled = (feature) => {
    return RUNTIME_FEATURE_FLAGS[feature] || false;
};

/**
 * 获取可用的登录方式
 * @returns {Array} - 可用的登录方式列表
 */
export const getAvailableLoginMethods = () => {
    const methods = [];

    if (isFeatureEnabled('PASSWORD_LOGIN_ENABLED')) {
        methods.push('password');
    }

    if (isFeatureEnabled('SMS_SERVICE_ENABLED')) {
        methods.push('sms');
    }

    if (isFeatureEnabled('EMAIL_SERVICE_ENABLED')) {
        methods.push('email');
    }

    return methods;
};

/**
 * 获取可用的注册方式
 * @returns {Array} - 可用的注册方式列表
 */
export const getAvailableRegisterMethods = () => {
    const methods = [];

    if (isFeatureEnabled('SMS_SERVICE_ENABLED')) {
        methods.push('phone');
    }

    if (isFeatureEnabled('EMAIL_SERVICE_ENABLED')) {
        methods.push('email');
    }

    return methods;
};

/**
 * 获取可用的密码重置方式
 * @returns {Array} - 可用的密码重置方式列表
 */
export const getAvailableResetMethods = () => {
    const methods = [];

    if (isFeatureEnabled('SMS_SERVICE_ENABLED')) {
        methods.push('phone');
    }

    if (isFeatureEnabled('EMAIL_SERVICE_ENABLED')) {
        methods.push('email');
    }

    return methods;
};

// 初始化时获取配置
fetchFeatureFlags(); 