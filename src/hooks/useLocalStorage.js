import { useState, useEffect } from 'react';

/**
 * 本地存储 Hook
 * @param {string} key - 存储键名
 * @param {any} initialValue - 初始值
 * @returns {[any, Function]} [存储的值, 设置值的函数]
 */
export function useLocalStorage(key, initialValue) {
    // 状态存储值
    const [storedValue, setStoredValue] = useState(() => {
        try {
            // 从localStorage获取值
            const item = window.localStorage.getItem(key);
            // 解析存储的JSON，如果没有则返回初始值
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            // 如果出错，返回初始值
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // 返回包装后的setValue函数，该函数会持久化新值到localStorage
    const setValue = (value) => {
        try {
            // 允许值是一个函数，这样我们就有了与useState相同的API
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // 保存状态
            setStoredValue(valueToStore);

            // 保存到localStorage
            if (valueToStore === undefined) {
                window.localStorage.removeItem(key);
            } else {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
}

/**
 * 会话存储 Hook
 * @param {string} key - 存储键名
 * @param {any} initialValue - 初始值
 * @returns {[any, Function]} [存储的值, 设置值的函数]
 */
export function useSessionStorage(key, initialValue) {
    // 状态存储值
    const [storedValue, setStoredValue] = useState(() => {
        try {
            // 从sessionStorage获取值
            const item = window.sessionStorage.getItem(key);
            // 解析存储的JSON，如果没有则返回初始值
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            // 如果出错，返回初始值
            console.warn(`Error reading sessionStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // 返回包装后的setValue函数，该函数会持久化新值到sessionStorage
    const setValue = (value) => {
        try {
            // 允许值是一个函数，这样我们就有了与useState相同的API
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // 保存状态
            setStoredValue(valueToStore);

            // 保存到sessionStorage
            if (valueToStore === undefined) {
                window.sessionStorage.removeItem(key);
            } else {
                window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.warn(`Error setting sessionStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
}

/**
 * 监听存储变化 Hook
 * @param {string} key - 存储键名
 * @param {string} storageType - 存储类型 ('local' | 'session')
 * @param {Function} callback - 变化回调函数
 */
export function useStorageListener(key, storageType = 'local', callback) {
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === key && e.storageArea === window[`${storageType}Storage`]) {
                const newValue = e.newValue ? JSON.parse(e.newValue) : null;
                const oldValue = e.oldValue ? JSON.parse(e.oldValue) : null;
                callback(newValue, oldValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key, storageType, callback]);
}

export default useLocalStorage; 