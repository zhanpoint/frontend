import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * WebSocket 连接状态枚举
 */
export const WEBSOCKET_STATUS = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
};

/**
 * WebSocket Hook
 * @param {string} url - WebSocket 连接URL
 * @param {Object} options - 配置选项
 * @param {Function} options.onMessage - 消息接收回调
 * @param {Function} options.onOpen - 连接打开回调
 * @param {Function} options.onClose - 连接关闭回调
 * @param {Function} options.onError - 错误回调
 * @param {boolean} options.shouldReconnect - 是否自动重连
 * @param {number} options.reconnectAttempts - 最大重连次数
 * @param {number} options.reconnectInterval - 重连间隔（毫秒）
 * @param {Array} options.protocols - WebSocket协议数组
 * @returns {Object} WebSocket 控制对象
 */
export function useWebSocket(url, options = {}) {
    const {
        onMessage,
        onOpen,
        onClose,
        onError,
        shouldReconnect = true,
        reconnectAttempts = 5,
        reconnectInterval = 3000,
        protocols = [],
    } = options;

    const [status, setStatus] = useState(WEBSOCKET_STATUS.DISCONNECTED);
    const [lastMessage, setLastMessage] = useState(null);
    const [connectionError, setConnectionError] = useState(null);

    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectCountRef = useRef(0);
    const urlRef = useRef(url);

    // 更新URL引用
    useEffect(() => {
        urlRef.current = url;
    }, [url]);

    // 发送消息
    const sendMessage = useCallback((message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
            wsRef.current.send(messageToSend);
            return true;
        } else {
            console.warn('WebSocket is not connected');
            return false;
        }
    }, []);

    // 连接WebSocket
    const connect = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            return; // 已经连接
        }

        try {
            setStatus(WEBSOCKET_STATUS.CONNECTING);
            setConnectionError(null);

            const ws = new WebSocket(urlRef.current, protocols);
            wsRef.current = ws;

            ws.onopen = (event) => {
                setStatus(WEBSOCKET_STATUS.CONNECTED);
                reconnectCountRef.current = 0; // 重置重连计数

                if (onOpen) {
                    onOpen(event);
                }
            };

            ws.onmessage = (event) => {
                let parsedMessage;
                try {
                    parsedMessage = JSON.parse(event.data);
                } catch {
                    parsedMessage = event.data;
                }

                setLastMessage({
                    data: parsedMessage,
                    timestamp: Date.now(),
                });

                if (onMessage) {
                    onMessage(parsedMessage, event);
                }
            };

            ws.onclose = (event) => {
                setStatus(WEBSOCKET_STATUS.DISCONNECTED);
                wsRef.current = null;

                if (onClose) {
                    onClose(event);
                }

                // 自动重连逻辑
                if (shouldReconnect && reconnectCountRef.current < reconnectAttempts && !event.wasClean) {
                    reconnectCountRef.current += 1;
                    console.log(`WebSocket reconnecting... Attempt ${reconnectCountRef.current}/${reconnectAttempts}`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, reconnectInterval);
                }
            };

            ws.onerror = (event) => {
                setStatus(WEBSOCKET_STATUS.ERROR);
                setConnectionError(event);

                if (onError) {
                    onError(event);
                }
            };

        } catch (error) {
            setStatus(WEBSOCKET_STATUS.ERROR);
            setConnectionError(error);
            console.error('WebSocket connection failed:', error);
        }
    }, [onMessage, onOpen, onClose, onError, shouldReconnect, reconnectAttempts, reconnectInterval, protocols]);

    // 断开连接
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'Manual disconnect');
            wsRef.current = null;
        }

        setStatus(WEBSOCKET_STATUS.DISCONNECTED);
        reconnectCountRef.current = 0;
    }, []);

    // 重新连接
    const reconnect = useCallback(() => {
        disconnect();
        setTimeout(connect, 100); // 短暂延迟后重连
    }, [disconnect, connect]);

    // 组件挂载时连接
    useEffect(() => {
        if (url) {
            connect();
        }

        // 清理函数
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmounted');
            }
        };
    }, [url, connect]);

    // URL变化时重新连接
    useEffect(() => {
        if (url && url !== urlRef.current) {
            reconnect();
        }
    }, [url, reconnect]);

    return {
        // 状态
        status,
        lastMessage,
        connectionError,
        isConnected: status === WEBSOCKET_STATUS.CONNECTED,
        isConnecting: status === WEBSOCKET_STATUS.CONNECTING,

        // 方法
        sendMessage,
        connect,
        disconnect,
        reconnect,

        // 重连信息
        reconnectCount: reconnectCountRef.current,
        maxReconnectAttempts: reconnectAttempts,
    };
}

export default useWebSocket; 