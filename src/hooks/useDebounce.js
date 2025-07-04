import { useState, useEffect } from 'react';

/**
 * 防抖 Hook
 * @param {any} value - 需要防抖的值
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {any} 防抖后的值
 */
export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // 设置定时器
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // 清理函数，在依赖项变化时清除定时器
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * 防抖回调 Hook
 * @param {Function} callback - 需要防抖的回调函数
 * @param {number} delay - 延迟时间（毫秒）
 * @param {Array} deps - 依赖数组
 * @returns {Function} 防抖后的回调函数
 */
export function useDebouncedCallback(callback, delay, deps = []) {
    const [debounceTimer, setDebounceTimer] = useState(null);

    const debouncedCallback = (...args) => {
        // 清除之前的定时器
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        // 设置新的定时器
        const newTimer = setTimeout(() => {
            callback(...args);
        }, delay);

        setDebounceTimer(newTimer);
    };

    // 清理函数
    useEffect(() => {
        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
        };
    }, [debounceTimer]);

    return debouncedCallback;
}

export default useDebounce; 