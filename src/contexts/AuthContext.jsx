import React, { createContext, useContext, useState, useEffect } from 'react';
import { tokenManager } from '../services/auth/tokenManager';
import passwordAuth from '../services/auth/passwordAuth';
import smsAuth from '../services/auth/smsAuth';
import emailAuth from '../services/auth/emailAuth';

// 创建认证上下文
const AuthContext = createContext(null);

/**
 * 认证上下文提供者
 */
export function AuthProvider({ children }) {
    // 状态管理
    const [user, setUser] = useState(null);  // 用户信息:当前登录用户的详细资料
    const [isLoading, setIsLoading] = useState(true);  // 加载状态:是否正在加载认证状态

    // 初始化认证状态
    useEffect(() => {
        const initAuth = () => {
            try {
                // 检查令牌是否有效
                if (tokenManager.isAccessTokenValid()) {
                    const userData = tokenManager.getUserData();
                    if (userData) {
                        setUser(userData);
                    } else {
                        // 有令牌但没有用户数据，清除令牌
                        tokenManager.clearAll();
                    }
                } else {
                    // 令牌无效，清除所有数据
                    tokenManager.clearAll();
                }
            } catch (error) {
                console.error('初始化认证状态失败:', error);
                tokenManager.clearAll();
            } finally {
                setIsLoading(false);
            }
        };

        const handleAuthRequired = () => {
            setUser(null);
            tokenManager.clearAll();
        };

        const handleLogout = () => {
            setUser(null);
        };

        // 监听认证事件
        window.addEventListener('auth:required', handleAuthRequired);
        window.addEventListener('auth:logout', handleLogout);

        initAuth();

        return () => {
            window.removeEventListener('auth:required', handleAuthRequired);
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, []);

    /**
     * 统一登录处理函数
     * @param {string} loginType - 登录类型: 'password' | 'sms' | 'email'
     * @param {Object} credentials - 登录凭据
     * @returns {Promise<{success: boolean, message?: string, data?: Object}>}
     */
    const login = async (loginType, credentials) => {
        try {
            let response;

            switch (loginType) {
                case 'password':
                    response = await fetch('/api/auth/sessions/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            loginType: 'password',
                            username: credentials.username,
                            password: credentials.password
                        }),
                    });
                    break;

                case 'sms':
                    response = await smsAuth.loginWithCode(credentials.phone, credentials.verificationCode);
                    break;

                case 'email':
                    response = await emailAuth.loginWithEmailCode(credentials.email, credentials.verificationCode);
                    break;

                default:
                    return {
                        success: false,
                        message: '不支持的登录方式'
                    };
            }

            // 处理响应数据
            let data;
            if (loginType === 'password') {
                data = await response.json();
            } else {
                data = response.data;
            }

            if (data.code === 200) {
                // 保存令牌和用户数据
                const { access, refresh } = data;
                const userData = data.data;

                tokenManager.setTokens(access, refresh);
                tokenManager.setUserData(userData);
                setUser(userData);

                return {
                    success: true,
                    data: userData
                };
            } else {
                return {
                    success: false,
                    message: data.message || '登录失败'
                };
            }
        } catch (error) {
            console.error(`${loginType}登录错误:`, error);

            // 处理不同类型的错误
            if (error.response?.data?.message) {
                return {
                    success: false,
                    message: error.response.data.message,
                    field: error.response.data.field
                };
            }

            return {
                success: false,
                message: '网络错误，请稍后重试'
            };
        }
    };

    // 登出方法
    const logout = () => {
        setUser(null);
        tokenManager.clearAll();
        window.dispatchEvent(new CustomEvent('auth:logout'));
    };

    // 上下文提供的值
    const value = {
        user,  // 用户信息
        isLoading,  // 加载状态
        isAuthenticated: !!user && tokenManager.isAccessTokenValid(),
        login,  // 统一登录方法
        logout,  // 登出方法
        // 新增功能
        getTokenRemainingTime: tokenManager.getTokenRemainingTime,
        shouldRefreshToken: tokenManager.shouldRefreshToken,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * 自定义Hook: 使用认证上下文
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth 必须在 AuthProvider 内部使用');
    }
    return context;
}

export default AuthContext; 