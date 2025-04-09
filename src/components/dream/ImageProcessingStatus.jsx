import React from "react";
import { motion } from "framer-motion";
import "./css/ImageProcessingStatus.css";

/**
 * 图片处理状态组件
 * 显示图片处理的进度和状态
 * 
 * @param {Object} props
 * @param {string} props.status - 处理状态 (processing, completed, failed)
 * @param {number} props.progress - 处理进度 (0-100)
 * @param {string} props.message - 状态消息
 */
const ImageProcessingStatus = ({ status = "processing", progress = 0, message = "图片处理中..." }) => {
    // 状态对应的图标和颜色
    const statusConfig = {
        processing: {
            icon: "🔄",
            color: "#6366f1",
            label: "处理中"
        },
        completed: {
            icon: "✅",
            color: "#10b981",
            label: "已完成"
        },
        failed: {
            icon: "❌",
            color: "#ef4444",
            label: "失败"
        }
    };

    // 获取当前状态配置
    const config = statusConfig[status] || statusConfig.processing;

    return (
        <motion.div
            className={`image-processing-container ${status}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div
                className="image-processing-status"
                style={{ borderColor: config.color }}
            >
                <div className="status-icon">
                    <span>{config.icon}</span>
                </div>

                <div className="status-content">
                    <div className="status-header">
                        <h3 style={{ color: config.color }}>{config.label}</h3>
                        <span className="status-message">{message}</span>
                    </div>

                    {status === 'processing' && (
                        <div className="progress-container">
                            <div
                                className={`progress-bar ${status}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ImageProcessingStatus; 