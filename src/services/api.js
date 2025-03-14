import axios from 'axios';

// 创建Axios实例
const api = axios.create({
    // 根据实际部署环境设置baseURL
    baseURL: import.meta.env.MODE === 'production'
        ? 'https://yourdomain.com/api' // 生产环境API地址
        : 'http://localhost:8412/api',  // 开发环境API地址

    // 请求超时时间
    timeout: 10000,

    // 请求头
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// 请求拦截器
api.interceptors.request.use(
    (config) => {
        // 在发送请求前做些什么
        // 例如：添加认证token
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // 对请求错误做些什么
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    (response) => {
        // 对响应数据做点什么
        return response;
    },
    (error) => {
        // 对响应错误做点什么
        // 例如：统一处理特定错误码
        if (error.response) {
            // 服务器返回了错误码
            if (error.response.status === 401) {
                // 未授权，可能是token过期
                localStorage.removeItem('token');
                // 可以在这里添加重定向到登录页面的逻辑
            }

            if (error.response.status === 403) {
                // 禁止访问
                console.error('没有权限访问此资源');
            }

            if (error.response.status === 500) {
                // 服务器错误
                console.error('服务器错误，请稍后再试');
            }
        } else if (error.request) {
            // 请求发出，但没有收到响应
            console.error('网络错误，无法连接到服务器');
        } else {
            // 请求设置出错
            console.error('请求设置出错:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api; 