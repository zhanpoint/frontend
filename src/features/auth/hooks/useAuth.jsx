import React, { createContext, useContext, useState, useEffect } from 'react';
import { tokenManager } from '@/shared/api/tokenManager';

const AuthContext = createContext(null);

/**
 * 认证Provider组件
 * 管理全局认证状态
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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
                console.error('认证初始化失败:', error);
                tokenManager.clearAll();
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // 监听认证事件
        const handleAuthLogin = (event) => {
            setUser(event.detail);
        };

        const handleAuthLogout = () => {
            setUser(null);
        };

        window.addEventListener('auth:login', handleAuthLogin);
        window.addEventListener('auth:logout', handleAuthLogout);

        return () => {
            window.removeEventListener('auth:login', handleAuthLogin);
            window.removeEventListener('auth:logout', handleAuthLogout);
        };
    }, []);

    /**
     * 用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    const login = async (username, password) => {
        try {
            setIsLoading(true);

            const response = await fetch('/api/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok && data.code === 200) {
                const { access, refresh, user: userData } = data.data;

                // 保存令牌和用户数据
                tokenManager.setTokens(access, refresh);
                tokenManager.setUserData(userData);

                setUser(userData);

                // 触发登录事件
                window.dispatchEvent(new CustomEvent('auth:login', { detail: userData }));

                return { success: true };
            } else {
                return {
                    success: false,
                    message: data.message || '登录失败，请检查用户名和密码'
                };
            }
        } catch (error) {
            console.error('登录失败:', error);
            return {
                success: false,
                message: '网络错误，请稍后重试'
            };
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 用户登出
     */
    const logout = async () => {
        try {
            // 调用后端登出接口
            const refreshToken = tokenManager.getRefreshToken();
            if (refreshToken) {
                await fetch('/api/auth/logout/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tokenManager.getAccessToken()}`,
                    },
                    body: JSON.stringify({ refresh: refreshToken }),
                });
            }
        } catch (error) {
            console.error('登出请求失败:', error);
        } finally {
            // 无论后端请求是否成功，都清除本地数据
            tokenManager.clearAll();
            setUser(null);

            // 触发登出事件
            window.dispatchEvent(new CustomEvent('auth:logout'));
        }
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * 使用认证状态的Hook
 * @returns {Object} 认证状态和方法
 */
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth必须在AuthProvider内部使用');
    }

    return context;
} 