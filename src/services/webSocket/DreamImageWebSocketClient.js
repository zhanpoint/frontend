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
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000;
        this.pingInterval = null;
        this.isConnecting = false;
        this.connectionTimeout = null;
        this.authenticated = false;
        this.isComponentMounted = true; // 跟踪组件是否已卸载
    }

    /**
     * 连接到WebSocket服务器
     */
    connect() {
        // 避免重复连接
        if (this.isConnecting || !this.isComponentMounted) return;
        this.isConnecting = true;

        // 关闭现有连接
        if (this.socket) {
            this.close();
        }

        // 检查环境是否支持WebSocket
        if (!window.WebSocket) {
            console.error('当前浏览器不支持WebSocket');
            notification.error('您的浏览器不支持实时图片更新');
            this.isConnecting = false;
            return;
        }

        // 创建WebSocket连接
        // 使用相对路径，依赖Vite代理配置转发
        // 在URL中添加认证令牌作为查询参数，确保在连接初始化时传递
        const token = this.authToken.startsWith('Bearer ') ? this.authToken.substring(7) : this.authToken;
        const encodedToken = encodeURIComponent(token);
        const wsUrl = `/ws/dream-images/${this.dreamId}/?token=${encodedToken}`;

        console.log(`尝试连接WebSocket: ${wsUrl}`);

        try {
            // 设置连接超时处理
            this.connectionTimeout = setTimeout(() => {
                if (!this.authenticated && this.isComponentMounted) {
                    console.error("WebSocket连接超时");
                    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
                        this.socket.close(1000, "连接超时");
                    }
                    this.handleClose({ code: 1006, reason: "连接超时" });
                }
            }, 15000); // 增加超时时间到15秒

            // 创建标准WebSocket连接
            this.socket = new WebSocket(wsUrl);
            console.log("WebSocket实例已创建");

            // 设置事件处理器
            this.socket.onopen = this.handleOpen.bind(this);
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
            this.socket.onerror = this.handleError.bind(this);

            // 增加连接状态日志
            console.log(`WebSocket连接状态: ${this.socket.readyState}`);
        } catch (error) {
            console.error("创建WebSocket实例失败:", error);
            if (this.isComponentMounted) {
                notification.error('无法连接到图片处理服务');
                this.isConnecting = false;
                this.scheduleReconnect();
            }
        }
    }

    /**
     * 处理WebSocket连接建立
     */
    handleOpen() {
        console.log(`WebSocket连接已建立: ${this.dreamId}`);
        this.isConnecting = false;

        // 由于我们已经在URL中传递了令牌，不需要再次发送认证消息
        // 连接建立后等待服务器的connection_established消息
        console.log("等待服务器确认连接...");
    }

    /**
     * 处理接收到的WebSocket消息
     * @param {MessageEvent} event - WebSocket消息事件
     */
    handleMessage(event) {
        if (!this.isComponentMounted) return;

        try {
            const data = JSON.parse(event.data);
            console.log("WebSocket收到消息:", data);

            // 处理不同类型的消息
            switch (data.type) {
                case 'connection_established':
                    console.log(`WebSocket认证成功, 连接已建立: ${data.message}`);
                    this.authenticated = true;

                    // 清除连接超时
                    if (this.connectionTimeout) {
                        clearTimeout(this.connectionTimeout);
                        this.connectionTimeout = null;
                    }

                    // 重置重连尝试次数
                    this.reconnectAttempts = 0;

                    // 启动定时ping，保持连接活跃
                    this.startPingInterval();

                    // 通知连接成功
                    notification.success('图片处理状态更新已连接');
                    break;

                case 'image_update':
                    console.log("收到图片更新:", data);
                    // 处理图片更新消息
                    if (this.onImageUpdate && typeof this.onImageUpdate === 'function') {
                        this.onImageUpdate(data);
                    }
                    break;

                case 'pong':
                    // 服务器心跳响应
                    console.debug('收到服务器心跳响应');
                    break;

                default:
                    console.log(`收到未知类型消息: ${data.type}`, data);
            }
        } catch (error) {
            console.error('处理WebSocket消息失败:', error, '原始消息:', event.data);
        }
    }

    /**
     * 处理WebSocket连接关闭
     * @param {CloseEvent} event - 关闭事件
     */
    handleClose(event) {
        console.log(`WebSocket连接已关闭: 码=${event.code}, 原因=${event.reason}`);
        this.isConnecting = false;
        this.authenticated = false;
        this.stopPingInterval();

        // 清除连接超时
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }

        if (this.isComponentMounted) {
            this.scheduleReconnect();
        }
    }

    /**
     * 安排重新连接
     */
    scheduleReconnect() {
        // 如果组件已卸载，不进行重连
        if (!this.isComponentMounted) return;

        // 尝试重新连接
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            // 使用指数退避策略，但设置上限
            const baseDelay = this.reconnectDelay;
            const maxDelay = 30000; // 最大30秒
            const delay = Math.min(baseDelay * Math.pow(1.5, this.reconnectAttempts - 1), maxDelay);

            console.log(`尝试在${delay}毫秒后重新连接... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                if (this.isComponentMounted) {
                    this.connect();
                }
            }, delay);
        } else {
            console.error('达到最大重连次数，停止重连');
            notification.warning('图片处理状态更新连接已断开');
        }
    }

    /**
     * 处理WebSocket错误
     * @param {Event} error - 错误事件
     */
    handleError(error) {
        console.error('WebSocket错误:', error);
        // 错误不关闭Socket，等待onclose事件
    }

    /**
     * 启动心跳检测间隔
     */
    startPingInterval() {
        this.stopPingInterval(); // 先停止现有的，避免重复

        this.pingInterval = setInterval(() => {
            if (!this.isComponentMounted) {
                this.stopPingInterval();
                return;
            }

            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                try {
                    this.sendJSON({
                        type: 'ping',
                        timestamp: Date.now()
                    });
                } catch (e) {
                    console.error('发送心跳包失败:', e);
                    this.socket.close();
                }
            } else {
                // 如果连接已经关闭但计时器仍在运行，则清除它
                this.stopPingInterval();
            }
        }, 25000); // 25秒发送一次心跳，略小于后端超时时间
    }

    /**
     * 停止心跳检测间隔
     */
    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * 发送JSON数据
     * @param {Object} data - 要发送的数据对象
     */
    sendJSON(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('发送消息失败:', e);
                return false;
            }
        }
        return false;
    }

    /**
     * 关闭WebSocket连接
     */
    close() {
        this.stopPingInterval();

        // 清除连接超时
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }

        if (this.socket) {
            try {
                this.socket.close();
            } catch (e) {
                console.error('关闭WebSocket时出错:', e);
            } finally {
                this.socket = null;
                this.authenticated = false;
                this.isConnecting = false;
            }
        }
    }

    /**
     * 组件卸载时调用，防止内存泄漏
     */
    unmount() {
        this.isComponentMounted = false;
        this.close();
    }
}

export default DreamImageWebSocketClient; 