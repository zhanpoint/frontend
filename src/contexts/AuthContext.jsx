import React, { createContext, useContext, useState, useEffect } from 'react';
import { tokenManager } from '../services/auth/tokenManager';

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

    // 登录方法
    const login = async (username, password) => {
        try {
            const response = await fetch('/api/auth/sessions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    loginType: 'password',
                    username,
                    password
                }),
            });

            const data = await response.json();

            if (data.code === 200) {
                // 保存令牌和用户数据
                tokenManager.setTokens(data.access, data.refresh);
                tokenManager.setUserData(data.data);
                setUser(data.data);
                return { success: true };
            } else {
                return {
                    success: false,
                    message: data.message || '登录失败'
                };
            }
        } catch (error) {
            console.error('登录错误:', error);
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
        login,  // 登录方法
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

export default AuthContext; 