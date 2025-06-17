import notification from "@/utils/notification";

/**
 * 梦境图片WebSocket客户端 - 接收图片处理状态更新
 */
class DreamImageWebSocketClient {
    /**
     * 初始化WebSocket客户端
     * @param {string} dreamId - 梦境ID
     * @param {string} authToken - JWT认证令牌
     * @param {Function} onImageUpdate - 图片更新回调函数
     */
    constructor(dreamId, authToken, onImageUpdate) {
        // 基本属性设置
        this.dreamId = dreamId;
        this.authToken = authToken;
        this.onImageUpdate = onImageUpdate;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.pingInterval = null;
        this.isComponentMounted = true;
    }

    /**
     * 连接到WebSocket服务器
     */
    connect() {
        // 避免重复连接或无效条件
        if (!this.isComponentMounted || this.socket || !window.WebSocket) {
            if (!window.WebSocket) notification.error('您的浏览器不支持实时图片更新');
            return;
        }

        try {
            // 创建WebSocket连接
            const token = this.authToken.replace(/^Bearer\s+/, '');
            const wsUrl = `/ws/dream-images/${this.dreamId}/?token=${encodeURIComponent(token)}`;
            this.socket = new WebSocket(wsUrl);

            // 设置事件处理器
            this.socket.onopen = () => {
                this.reconnectAttempts = 0;
            };

            this.socket.onmessage = (event) => {
                if (!this.isComponentMounted) return;

                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'connection_established':
                            this.isAuthenticated = true;
                            this.startPingInterval();
                            this.sendJSON({ type: 'request_status', dream_id: this.dreamId });
                            break;

                        case 'image_update':
                            this.onImageUpdate?.(data);
                            break;

                        case 'ping':
                            this.sendJSON({ type: 'pong', timestamp: Date.now() });
                            break;
                    }
                } catch {
                    // 静默处理解析错误
                }
            };

            this.socket.onclose = () => {
                this.cleanup();
                this.scheduleReconnect();
            };

            this.socket.onerror = () => { /* 错误将在close事件中处理 */ };
        } catch {
            this.scheduleReconnect();
        }
    }

    /**
     * 安排重新连接
     */
    scheduleReconnect() {
        if (!this.isComponentMounted || this.reconnectAttempts >= this.maxReconnectAttempts) return;

        this.reconnectAttempts++;
        const delay = Math.min(2000 * Math.pow(1.5, this.reconnectAttempts - 1), 10000);

        setTimeout(() => {
            if (this.isComponentMounted) this.connect();
        }, delay);
    }

    /**
     * 启动心跳检测
     */
    startPingInterval() {
        this.stopPingInterval();
        this.pingInterval = setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                this.sendJSON({ type: 'ping', timestamp: Date.now() });
            } else {
                this.stopPingInterval();
            }
        }, 10000);
    }

    /**
     * 停止心跳检测
     */
    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * 发送JSON数据
     */
    sendJSON(data) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify(data));
                return true;
            } catch {
                return false;
            }
        }
        return false;
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.isAuthenticated = false;
        this.stopPingInterval();
    }

    /**
     * 关闭WebSocket连接
     */
    close() {
        this.cleanup();
        if (this.socket) {
            try {
                this.socket.close(1000, "客户端主动关闭");
            } catch {
                // 忽略关闭错误
            }
            this.socket = null;
        }
    }

    /**
     * 组件卸载时调用，清理资源
     */
    unmount() {
        this.isComponentMounted = false;
        this.close();
    }
}

export default DreamImageWebSocketClient; 