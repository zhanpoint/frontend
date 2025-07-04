import { useContext } from 'react';
import AuthContext from '@/contexts/AuthContext';

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