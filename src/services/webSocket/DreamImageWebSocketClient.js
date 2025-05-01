import notification from "@/utils/notification";

/**
 * 梦境图片WebSocket客户端
 * 用于接收图片处理状态更新
 */
class DreamImageWebSocketClient {
    /**
     * 初始化WebSocket客户端
     * @param {string} dreamId - 梦境ID
     * @param {string} authToken - JWT认证令牌
     * @param {Function} onImageUpdate - 图片更新回调函数
     */
    constructor(dreamId, authToken, onImageUpdate) {
        this.dreamId = dreamId;
        this.authToken = authToken;
        this.onImageUpdate = onImageUpdate;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.pingInterval = null;
        this.isConnecting = false;
        this.isAuthenticated = false;
        this.isComponentMounted = true;
    }

    /**
     * 连接到WebSocket服务器
     */
    connect() {
        // 避免重复连接
        if (this.isConnecting || !this.isComponentMounted || this.socket) return;

        this.isConnecting = true;

        // 检查浏览器支持
        if (!window.WebSocket) {
            notification.error('您的浏览器不支持实时图片更新');
            this.isConnecting = false;
            return;
        }

        // 创建WebSocket连接
        try {
            const token = this.authToken.startsWith('Bearer ') ? this.authToken.substring(7) : this.authToken;
            const wsUrl = `/ws/dream-images/${this.dreamId}/?token=${encodeURIComponent(token)}`;

            this.socket = new WebSocket(wsUrl);
            this.socket.onopen = this.handleOpen.bind(this);
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
            this.socket.onerror = this.handleError.bind(this);
        } catch (error) {
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    /**
     * 处理WebSocket连接建立
     */
    handleOpen() {
        this.isConnecting = false;
    }

    /**
     * 处理接收到的WebSocket消息
     */
    handleMessage(event) {
        if (!this.isComponentMounted) return;

        try {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'connection_established':
                    this.handleAuthenticated();
                    break;

                case 'image_update':
                    if (this.onImageUpdate && typeof this.onImageUpdate === 'function') {
                        this.onImageUpdate(data);
                    }
                    break;

                case 'ping':
                    this.sendJSON({ type: 'pong', timestamp: Date.now() });
                    break;
            }
        } catch (error) {
            // 处理错误但不记录日志
        }
    }

    /**
     * 处理认证成功
     */
    handleAuthenticated() {
        this.isAuthenticated = true;
        this.reconnectAttempts = 0;
        this.startPingInterval();

        // 请求最新状态
        this.sendJSON({
            type: 'request_status',
            dream_id: this.dreamId
        });
    }

    /**
     * 处理WebSocket连接关闭
     */
    handleClose() {
        this.isConnecting = false;
        this.isAuthenticated = false;
        this.stopPingInterval();
        this.socket = null;

        if (this.isComponentMounted) {
            this.scheduleReconnect();
        }
    }

    /**
     * 安排重新连接
     */
    scheduleReconnect() {
        if (!this.isComponentMounted) return;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 10000);

            setTimeout(() => {
                if (this.isComponentMounted) {
                    this.connect();
                }
            }, delay);
        }
    }

    /**
     * 处理WebSocket错误
     */
    handleError() {
        // 错误会在close事件中处理
    }

    /**
     * 启动心跳检测
     */
    startPingInterval() {
        this.stopPingInterval();

        this.pingInterval = setInterval(() => {
            if (!this.isComponentMounted || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
                this.stopPingInterval();
                return;
            }

            this.sendJSON({
                type: 'ping',
                timestamp: Date.now()
            });
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
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return false;
        }

        try {
            this.socket.send(JSON.stringify(data));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 关闭WebSocket连接
     */
    close() {
        this.stopPingInterval();

        if (this.socket) {
            try {
                this.socket.close(1000, "客户端主动关闭");
            } catch {
                // 忽略关闭错误
            }
            this.socket = null;
        }

        this.isAuthenticated = false;
        this.isConnecting = false;
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