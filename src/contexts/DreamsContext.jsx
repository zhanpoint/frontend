import React, { createContext, useState, useContext, useCallback } from 'react';
import api from '@/services/api';
import notification from '@/utils/notification';
import { useAuth } from './AuthContext';

// 创建梦境数据上下文
const DreamsContext = createContext();

/**
 * 梦境数据上下文提供者
 */
export function DreamsProvider({ children }) {
    // 状态管理
    const [dreams, setDreams] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();

    // 获取用户梦境列表
    const fetchDreams = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);
            setError(null);

            // 发送API请求 - 使用RESTful API
            const response = await api.get('/dreams/');

            // 处理响应数据
            if (response.data && response.status === 200) {
                // 获取梦境数据
                const newDreams = Array.isArray(response.data) ? response.data : [];
                setDreams(newDreams);
                console.log(newDreams)
                console.log("DreamsContext: 成功获取梦境数据", newDreams.length);
            } else {
                // 只设置内部错误状态，不显示通知
                setError("获取梦境记录失败");
            }
        } catch (error) {
            console.error("获取梦境失败:", error);

            // 只设置内部错误状态，除非是特定的业务逻辑错误
            const errorMessage = error.response?.data?.message || "获取梦境记录失败，请稍后重试";
            setError(errorMessage);

            // 只在开发环境显示错误通知
            if (import.meta.env.DEV) {
                notification.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // 获取指定ID的梦境数据
    const getDreamById = useCallback((id) => {
        const foundDream = dreams.find(dream => dream.id === parseInt(id, 10) || dream.id === id);
        console.log(`DreamsContext: 查找梦境ID=${id}`, foundDream ? "已找到" : "未找到",
            `当前有${dreams.length}条梦境数据`);
        return foundDream;
    }, [dreams]);

    // 添加或更新梦境数据
    const addOrUpdateDream = useCallback((newDream) => {
        if (!newDream || !newDream.id) return;

        setDreams(prevDreams => {
            // 检查是否已存在该梦境
            const index = prevDreams.findIndex(dream => dream.id === newDream.id);

            if (index >= 0) {
                // 更新现有梦境
                const updatedDreams = [...prevDreams];
                updatedDreams[index] = newDream;
                return updatedDreams;
            } else {
                // 添加新梦境到列表头部
                return [newDream, ...prevDreams];
            }
        });

        console.log(`DreamsContext: ${newDream.id}号梦境已添加/更新到缓存`);
    }, []);

    // 清除梦境数据
    const clearDreams = useCallback(() => {
        setDreams([]);
    }, []);

    // 删除梦境数据
    const deleteDream = useCallback(async (dreamId) => {
        if (!dreamId || !isAuthenticated) return false;

        try {
            setIsLoading(true);

            // 发送删除请求到后端 - 使用RESTful API
            await api.delete(`/dreams/${dreamId}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            // 从本地缓存中移除
            setDreams(prevDreams => prevDreams.filter(dream => dream.id !== dreamId));

            notification.success('梦境记录已成功删除');
            console.log(`DreamsContext: 已删除${dreamId}号梦境`);
            return true;
        } catch (error) {
            console.error(`删除梦境失败: ID=${dreamId}`, error);
            const errorMessage = error.response?.data?.message || "删除梦境失败，请稍后重试";
            notification.error(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // 更新梦境数据
    const updateDream = useCallback(async (dreamData) => {
        if (!dreamData || !dreamData.id || !isAuthenticated) return false;

        try {
            setIsLoading(true);

            // 发送更新请求到后端 - 使用RESTful API
            const response = await api.put(`/dreams/${dreamData.id}/`, dreamData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            // 更新成功后，使用返回的数据更新本地缓存
            if (response.data) {
                // 检查是否有WebSocket通知信息
                if (response.data.images_status && response.data.images_status.status === 'processing') {
                    // 显示图片处理提示
                    notification.info(response.data.images_status.message || '图片正在后台处理中...');
                }

                // 先添加到本地缓存
                addOrUpdateDream(response.data);
                notification.success('梦境记录已成功更新');
                console.log(`DreamsContext: 已更新${dreamData.id}号梦境`);
                return response.data;
            }

            return false;
        } catch (error) {
            console.error(`更新梦境失败: ID=${dreamData.id}`, error);
            const errorMessage = error.response?.data?.message || "更新梦境失败，请稍后重试";
            notification.error(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, addOrUpdateDream]);

    // 上下文提供的值
    const value = {
        dreams,
        isLoading,
        error,
        fetchDreams,
        getDreamById,
        addOrUpdateDream,
        clearDreams,
        deleteDream,
        updateDream
    };

    return (
        <DreamsContext.Provider value={value}>
            {children}
        </DreamsContext.Provider>
    );
}

/**
 * 使用梦境数据上下文的钩子
 */
export function useDreams() {
    const context = useContext(DreamsContext);
    if (!context) {
        throw new Error('useDreams必须在DreamsProvider内部使用');
    }
    return context;
}

export default DreamsContext; 