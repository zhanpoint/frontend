import { DreamCarousel } from './ui/dream-carousel';
import { SparklesCore } from './ui/sparkles';
import { DreamGallery } from './ui/infinite-slider';

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
        </div>

    );
} 