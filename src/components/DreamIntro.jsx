import { DreamCarousel } from './ui/dream-carousel';
import { SparklesCore } from './ui/sparkles';
import { DreamGallery } from './ui/infinite-slider';
import { motion } from 'framer-motion';

// 验证并修复图片URL
const galleryImages = [
    "https://images.unsplash.com/photo-1682905926517-6be3768e29f0?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=3464&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1520962880247-cfaf541c8724?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?q=80&w=3464&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
];

export function DreamIntro() {
    return (
        <div className="w-full overflow-hidden">

            {/* 第二部分：梦境滚动画廊 */}
            <section className="py-16 bg-black">
                <div className="container mx-auto px-4 mb-12">
                    <h2 className="text-4xl font-bold text-center text-white mb-4">梦境画廊</h2>
                    <p className="text-xl text-center text-gray-450 max-w-3xl mx-auto">探索社区中分享的梦境瞬间，或许会激发你自己的梦境灵感</p>
                </div>

                <DreamGallery
                    images={galleryImages}
                    className="mb-16"
                    speed={40}
                />
            </section>

            {/* 第三部分：AI解梦助手介绍 */}
            <section className="py-20 bg-gradient-to-b from-black to-purple-950">
                <div className="container mx-auto px-4">
                    <motion.div
                        className="flex flex-col md:flex-row items-center justify-between gap-12"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="md:w-1/2">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                AI梦境解析助手
                            </h2>
                            <p className="text-xl text-gray-300 mb-6">
                                结合心理学、神经科学和生成式AI的智能助手，为您提供专业的梦境解析和个性化建议。
                            </p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <span className="text-purple-400 text-xl mt-1">✓</span>
                                    <span className="text-gray-300">融合荣格分析心理学与现代神经科学</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-purple-400 text-xl mt-1">✓</span>
                                    <span className="text-gray-300">提供多维度解析与潜意识探索</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-purple-400 text-xl mt-1">✓</span>
                                    <span className="text-gray-300">个性化成长建议与实践方法</span>
                                </li>
                            </ul>
                            <p className="text-gray-400 italic">
                                点击右下角对话图标，立即与AI助手交流
                            </p>
                        </div>
                        <div className="md:w-1/2 relative">
                            <div className="w-full h-96 bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-xl overflow-hidden shadow-2xl shadow-purple-900/50 border border-purple-500/20">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center opacity-30 rounded-xl"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center p-8">
                                        <div className="text-6xl mb-4">🤖</div>
                                        <h3 className="text-2xl font-bold text-white mb-2">梦境解析助手</h3>
                                        <p className="text-gray-300">随时为您提供专业梦境分析</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
} 