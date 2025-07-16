/**
 * 图片管理 Hook - 简化版
 * 主要用于处理图片的软删除和恢复
 */

import { useState, useCallback, useRef } from 'react';
import { apiClient } from '../services/api/client';

/**
 * 图片管理 Hook - 简化版
 * 主要用于处理图片的软删除和恢复
 */
export function useImageManager() {
    const [pendingDeleteUrls, setPendingDeleteUrls] = useState(new Set());
    const originalContentRef = useRef('');

    /**
     * 设置原始内容（用于比较）
     */
    const setOriginalContent = useCallback((content) => {
        originalContentRef.current = content;
    }, []);

    /**
     * 从HTML内容中提取图片URL
     */
    const extractImageUrls = useCallback((htmlContent) => {
        if (!htmlContent) return [];

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const images = doc.querySelectorAll('img');

            return Array.from(images)
                .map(img => img.src)
                .filter(src => src && isValidImageUrl(src));
        } catch (error) {
            console.error('提取图片URL失败:', error);
            return [];
        }
    }, []);

    /**
     * 检查是否为有效的图片URL
     */
    const isValidImageUrl = useCallback((url) => {
        if (!url || typeof url !== 'string') return false;

        // 检查是否为本项目的图片URL
        return ['dream-log', 'oss-cn-', 'aliyuncs.com'].some(domain => url.includes(domain));
    }, []);

    /**
     * 计算图片差异
     */
    const calculateImageDifferences = useCallback((oldContent, newContent) => {
        const oldUrls = new Set(extractImageUrls(oldContent));
        const newUrls = new Set(extractImageUrls(newContent));

        const deletedUrls = [...oldUrls].filter(url => !newUrls.has(url));
        const addedUrls = [...newUrls].filter(url => !oldUrls.has(url));
        const keptUrls = [...oldUrls].filter(url => newUrls.has(url));

        return { deletedUrls, addedUrls, keptUrls };
    }, [extractImageUrls]);

    /**
     * 获取图片变化信息
     */
    const getImageChanges = useCallback((newContent) => {
        return calculateImageDifferences(originalContentRef.current, newContent);
    }, [calculateImageDifferences]);

    /**
     * 标记单个图片为待删除
     */
    const markImageForDeletion = useCallback((imageUrl) => {
        if (!imageUrl || !isValidImageUrl(imageUrl)) return false;

        setPendingDeleteUrls(prev => new Set([...prev, imageUrl]));
        return true;
    }, [isValidImageUrl]);

    /**
     * 取消标记图片为待删除
     */
    const unmarkImageForDeletion = useCallback((imageUrl) => {
        setPendingDeleteUrls(prev => {
            const newSet = new Set(prev);
            newSet.delete(imageUrl);
            return newSet;
        });
    }, []);

    /**
     * 批量标记图片为待删除
     */
    const markImagesForDeletion = useCallback((imageUrls) => {
        const validUrls = imageUrls.filter(isValidImageUrl);
        setPendingDeleteUrls(prev => new Set([...prev, ...validUrls]));
        return validUrls.length;
    }, [isValidImageUrl]);

    /**
     * 处理Quill编辑器中的图片删除
     */
    const handleQuillImageDelete = useCallback((imageUrl, quillEditor) => {
        if (!imageUrl || !quillEditor) return false;

        try {
            // 从编辑器内容中移除图片
            const currentContent = quillEditor.root.innerHTML;
            const updatedContent = currentContent.replace(
                new RegExp(`<img[^>]*src=["']${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'gi'),
                ''
            );

            quillEditor.root.innerHTML = updatedContent;

            // 标记为待删除
            markImageForDeletion(imageUrl);

            return true;
        } catch (error) {
            console.error('删除图片失败:', error);
            return false;
        }
    }, [markImageForDeletion]);

    /**
     * 撤销图片删除（恢复到编辑器）
     */
    const undoImageDeletion = useCallback((imageUrl, quillEditor, insertPosition) => {
        if (!imageUrl || !quillEditor) return false;

        try {
            // 恢复图片到编辑器
            const position = insertPosition || quillEditor.getLength();
            quillEditor.insertEmbed(position, 'image', imageUrl);

            // 从待删除列表中移除
            unmarkImageForDeletion(imageUrl);

            return true;
        } catch (error) {
            console.error('恢复图片失败:', error);
            return false;
        }
    }, [unmarkImageForDeletion]);

    /**
     * 清理临时状态
     */
    const cleanup = useCallback(() => {
        setPendingDeleteUrls(new Set());
        originalContentRef.current = '';
    }, []);

    /**
     * 恢复已删除的图片（API调用）
     */
    const restoreImage = useCallback(async (imageUrl) => {
        try {
            const response = await apiClient.post('/files/restore/', {
                url: imageUrl
            });

            return {
                success: true,
                message: response.data.message,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error || '恢复图片失败'
            };
        }
    }, []);

    /**
     * 获取用户的图片统计信息
     */
    const getImageStats = useCallback(async () => {
        try {
            const response = await apiClient.get('/dreams/image_stats/');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error || '获取图片统计失败'
            };
        }
    }, []);

    return {
        // 状态
        pendingDeleteUrls: Array.from(pendingDeleteUrls),

        // 基础方法
        setOriginalContent,
        extractImageUrls,
        calculateImageDifferences,
        getImageChanges,

        // 标记管理
        markImageForDeletion,
        unmarkImageForDeletion,
        markImagesForDeletion,

        // Quill编辑器集成
        handleQuillImageDelete,
        undoImageDeletion,

        // API操作
        restoreImage,
        getImageStats,

        // 工具方法
        isValidImageUrl,
        cleanup
    };
} 