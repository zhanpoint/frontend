import { useContext } from 'react';
import { DreamsContext } from '@/contexts/DreamsContext';

/**
 * 使用梦境上下文的Hook
 * @returns {Object} 梦境状态和方法
 */
export function useDreams() {
    const context = useContext(DreamsContext);

    if (!context) {
        throw new Error('useDreams必须在DreamsProvider内部使用');
    }

    return context;
} 