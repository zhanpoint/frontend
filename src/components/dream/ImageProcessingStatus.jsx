import React from 'react';
import { AlertCircle, CheckCircle, CircleSlash, LoaderCircle, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

/**
 * 图片处理状态组件
 * 显示图片处理的不同状态：处理中、完成、失败
 */
const ImageProcessingStatus = ({ status, progress = 0, message }) => {
    // 状态配置 - 不同状态对应不同的图标、颜色和标题
    const statusConfig = {
        idle: {
            icon: <Image className="h-5 w-5" />,
            color: 'text-gray-400',
            bgColor: 'bg-gray-800',
            borderColor: 'border-gray-700',
            title: '准备处理图片',
        },
        processing: {
            icon: <LoaderCircle className="h-5 w-5 animate-spin" />,
            color: 'text-blue-400',
            bgColor: 'bg-blue-950/30',
            borderColor: 'border-blue-900/50',
            title: '图片处理中',
        },
        completed: {
            icon: <CheckCircle className="h-5 w-5" />,
            color: 'text-green-400',
            bgColor: 'bg-green-950/30',
            borderColor: 'border-green-900/50',
            title: '图片处理完成',
        },
        failed: {
            icon: <AlertCircle className="h-5 w-5" />,
            color: 'text-red-400',
            bgColor: 'bg-red-950/30',
            borderColor: 'border-red-900/50',
            title: '图片处理失败',
        },
        canceled: {
            icon: <CircleSlash className="h-5 w-5" />,
            color: 'text-amber-400',
            bgColor: 'bg-amber-950/30',
            borderColor: 'border-amber-900/50',
            title: '图片处理已取消',
        },
    };

    // 获取当前状态配置
    const currentStatus = statusConfig[status] || statusConfig.idle;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`rounded-lg ${currentStatus.bgColor} border ${currentStatus.borderColor} p-3 mb-4`}
            >
                <div className="flex items-center">
                    <div className={`flex-shrink-0 ${currentStatus.color}`}>
                        {currentStatus.icon}
                    </div>
                    <div className="ml-3 flex-grow">
                        <h3 className={`text-sm font-medium ${currentStatus.color}`}>
                            {currentStatus.title}
                        </h3>
                        {message && (
                            <p className="text-xs text-gray-400 mt-0.5">{message}</p>
                        )}
                    </div>
                </div>

                {status === 'processing' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2"
                    >
                        <Progress
                            value={progress}
                            className="h-1.5 bg-blue-950"
                            indicatorClassName="bg-blue-400"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{progress}%</p>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageProcessingStatus; 