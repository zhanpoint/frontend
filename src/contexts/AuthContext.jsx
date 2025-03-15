import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '@/services/authService';
import notification from '@/utils/notification';

// 创建认证上下文
const AuthContext = createContext();

/**
 * 认证上下文提供者
 */
export function AuthProvider({ children }) {
    // 状态管理
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 初始化认证状态
    useEffect(() => {
        const initAuth = () => {
            try {
                // 检查认证状态
                const isAuth = authService.isAuthenticated();
                setIsAuthenticated(isAuth);

                // 获取用户数据
                if (isAuth) {
                    setUser(authService.getCurrentUser());
                }
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // 监听认证事件
        const handleAuthRequired = () => {
            setIsAuthenticated(false);
            setUser(null);
            notification.warning('您的登录状态已过期，请重新登录');
        };

        const handleLogout = () => {
            setIsAuthenticated(false);
            setUser(null);
        };

        window.addEventListener('auth:required', handleAuthRequired);
        window.addEventListener('auth:logout', handleLogout);

        return () => {
            window.removeEventListener('auth:required', handleAuthRequired);
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, []);

    /**
     * 登录方法
     */
    const login = async (username, password) => {
        try {
            // 使用通知包装Promise显示加载状态
            const loginPromise = authService.login(username, password);

            notification.loading('正在登录...', loginPromise, {
                success: '登录成功！欢迎回来',
                error: '登录失败'
            });

            const response = await loginPromise;

            if (response.data.code === 200) {
                setUser(response.data.data);
                setIsAuthenticated(true);
                return { success: true, data: response.data };
            }

            notification.error(response.data.message || '登录失败');
            return {
                success: false,
                message: response.data.message || '登录失败'
            };
        } catch (error) {
            console.error('登录失败', error);
            const message = error.response?.data?.message || '登录失败，请检查网络连接';
            notification.error(message);
            return { success: false, message };
        }
    };

    /**
     * 注销方法
     */
    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    // 上下文提供的值
    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * 使用认证上下文的钩子
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth必须在AuthProvider内部使用');
    }
    return context;
}

export default AuthContext; 