import api from '../api';

class EmailAuth {
    /**
     * 邮箱验证码注册
     * @param {Object} userData - 用户数据
     * @param {string} userData.username - 用户名
     * @param {string} userData.email - 邮箱地址
     * @param {string} userData.password - 密码
     * @param {string} userData.code - 验证码
     * @returns {Promise} 注册结果
     */
    async registerWithEmailCode(userData) {
        try {
            const response = await api.post('/users/', userData);
            return response;
        } catch (error) {
            console.error('邮箱验证码注册失败:', error);
            throw error;
        }
    }

    /**
     * 邮箱验证码登录
     * @param {string} email - 邮箱地址
     * @param {string} code - 验证码
     * @returns {Promise} 登录结果
     */
    async loginWithEmailCode(email, code) {
        try {
            const response = await api.post('/auth/sessions/', {
                email,
                code
            });
            return response;
        } catch (error) {
            console.error('邮箱验证码登录失败:', error);
            throw error;
        }
    }

    /**
     * 邮箱重置密码
     * @param {string} email - 邮箱地址
     * @param {string} code - 验证码
     * @param {string} newPassword - 新密码
     * @returns {Promise} 重置结果
     */
    async resetPasswordWithEmail(email, code, newPassword) {
        try {
            const response = await api.put('/users/password/', {
                email,
                code,
                newPassword
            });
            return response;
        } catch (error) {
            console.error('邮箱重置密码失败:', error);
            throw error;
        }
    }
}

const emailAuth = new EmailAuth();
export { emailAuth };
export default emailAuth; 