import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '@/services';
import notification from '@/utils/notification';

// 创建认证上下文
const AuthContext = createContext();

/**
 * 认证上下文提供者
 */
export function AuthProvider({ children }) {
    // 状态管理
    const [user, setUser] = useState(null);  // 用户信息:当前登录用户的详细资料
    const [isAuthenticated, setIsAuthenticated] = useState(false);  // 认证状态:用户是否已登录
    const [isLoading, setIsLoading] = useState(true);  // 加载状态:是否正在加载认证状态

    // 初始化认证状态
    useEffect(() => {
        const initAuth = () => {
            try {
                // 检查认证状态
                const isAuth = auth.isAuthenticated();  // 检查本地存储的令牌是否有效
                setIsAuthenticated(isAuth);  // 更新认证状态

                // 获取用户数据
                if (isAuth) {
                    setUser(auth.getCurrentUser());
                }
            } finally {
                // 标记认证检查已完成，让应用知道可以渲染依赖于认证状态的组件了。
                setIsLoading(false);
            }
        };

        initAuth();

        // 监听认证事件:事件处理令牌过期的情况，当后端返回未授权错误时，可以触发此事件
        const handleAuthRequired = () => {
            setIsAuthenticated(false);
            setUser(null);
            notification.warning('您的登录状态已过期，请重新登录');
        };
        // 监听登出事件:当用户手动登出时，可以触发此事件
        const handleLogout = () => {
            setIsAuthenticated(false);
            setUser(null);
        };

        window.addEventListener('auth:required', handleAuthRequired);
        window.addEventListener('auth:logout', handleLogout);

        // 返回的清理函数移除事件监听器，防止内存泄漏和重复监听。
        return () => {
            window.removeEventListener('auth:required', handleAuthRequired);
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, []);

    // 登录方法
    const login = async (username, password) => {
        try {
            // 使用通知包装Promise显示加载状态
            const loginPromise = auth.login(username, password);

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

    // 登出方法
    const logout = () => {
        auth.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    // 上下文提供的值
    const value = {
        user,  // 用户信息
        isAuthenticated,  // 认证状态
        isLoading,  // 加载状态
        login,  // 登录方法
        logout  // 登出方法
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