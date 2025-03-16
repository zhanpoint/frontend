/**
 * 令牌管理器
 * 负责处理认证令牌和用户数据的存储、获取和清除
 */
export const tokenManager = {
    /**
     * 存储访问令牌和刷新令牌
     * @param {string} access - 访问令牌
     * @param {string} refresh - 刷新令牌
     */
    setTokens: (access, refresh) => {
        if (access) localStorage.setItem('accessToken', access);
        if (refresh) localStorage.setItem('refreshToken', refresh);
    },

    /**
     * 清除所有令牌
     */
    clearTokens: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },

    /**
     * 获取访问令牌
     * @returns {string|null} 访问令牌
     */
    getAccessToken: () => localStorage.getItem('accessToken'),

    /**
     * 获取刷新令牌
     * @returns {string|null} 刷新令牌
     */
    getRefreshToken: () => localStorage.getItem('refreshToken'),

    /**
     * 存储用户数据
     * @param {Object} data - 用户数据
     */
    setUserData: (data) => {
        if (data) localStorage.setItem('user', JSON.stringify(data));
    },

    /**
     * 获取用户数据
     * @returns {Object|null} 用户数据
     */
    getUserData: () => {
        try {
            return JSON.parse(localStorage.getItem('user') || null);
        } catch {
            return null;
        }
    },

    /**
     * 清除用户数据
     */
    clearUserData: () => {
        localStorage.removeItem('user');
    },

    /**
     * 保存完整的认证响应（令牌和用户数据）
     * @param {Object} response - API响应对象
     */
    saveAuthResponse: (response) => {
        if (response?.data?.code === 200 || response?.data?.code === 201) {
            const { access, refresh, data } = response.data;
            if (access && refresh) {
                tokenManager.setTokens(access, refresh);
            }
            if (data) {
                tokenManager.setUserData(data);
            }
            return true;
        }
        return false;
    }
};

export default tokenManager; 