import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, MoonStar } from 'lucide-react';

/**
 * 梦境AI助手组件
 * 提供嵌入式的AI聊天界面
 */
export function DreamAIAgent() {
    const [isOpen, setIsOpen] = useState(false);

    // 切换聊天窗口开关
    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* 悬浮球按钮 */}
            <Button
                onClick={toggleChat}
                className={`rounded-full w-14 h-14 shadow-lg bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 flex items-center justify-center transition-all duration-300 ${isOpen ? 'scale-105' : ''}`}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <MoonStar className="w-6 h-6 text-white" />
                )}
            </Button>

            {/* 聊天窗口 */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="absolute bottom-20 right-0 bg-gradient-to-b from-gray-900 to-black rounded-2xl shadow-[0_0_25px_rgba(139,92,246,0.3)] overflow-hidden"
                        style={{
                            width: '800px',
                            height: '400px',
                            maxWidth: 'calc(100vw - 2rem)',
                            maxHeight: 'calc(100vh - 5rem)'
                        }}
                    >
                        <div className="w-full h-[400px]">
                            <iframe
                                src="https://udify.app/chatbot/yUtaCCg8VQR1JqJb"
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                frameBorder="0"
                                allow="microphone"
                                title="梦境解析助手"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default DreamAIAgent; 