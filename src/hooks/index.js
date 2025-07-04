/**
 * Hooks 统一导出
 * 集中管理所有自定义 hooks
 */

// 业务相关 hooks
export { useAuth } from './useAuth';
export { useDreams } from './useDreams';

// 通用工具 hooks
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useLocalStorage, useSessionStorage, useStorageListener } from './useLocalStorage';

// 如果文件存在，再导出其他hooks
// export { useWebSocket, WEBSOCKET_STATUS } from './useWebSocket';
// export { useClickOutside } from './useClickOutside';

// 默认导出常用的hooks
export default {
    useAuth: require('./useAuth').useAuth,
    useDreams: require('./useDreams').useDreams,
    useDebounce: require('./useDebounce').useDebounce,
    useLocalStorage: require('./useLocalStorage').useLocalStorage,
}; 