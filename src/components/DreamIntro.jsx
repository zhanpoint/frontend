import { DreamCarousel } from './ui/dream-carousel';
import { SparklesCore } from './ui/sparkles';
import { DreamGallery } from './ui/infinite-slider';

const carouselSlides = [
    {
        title: "探索你的梦境世界",
        description: "记录、分析和解析你内心深处的梦境，揭示潜意识的奥秘",
        button: "开始探索",
    },
    {
        title: "梦境的奥秘与解析",
        description: "每一个梦境都蕴含着丰富的含义，通过记录和分析，了解自己的内心世界",
        button: "了解更多",
    },
    {
        title: "与社区分享你的梦境",
        description: "加入我们的梦境社区，分享奇妙的梦境体验，与他人一起探讨",
        button: "加入社区",
    }
];

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
            {/* 第一部分：梦境轮播 */}
            <section className="relative">
                <DreamCarousel
                    slides={carouselSlides}
                    autoPlay={true}
                    interval={5000}
                />
                <div className="absolute inset-0 pointer-events-none">
                    <SparklesCore
                        minSize={1.0}
                        maxSize={2.0}
                        particleDensity={60}
                        className="w-full h-full"
                        particleColor="#FFFFFF"
                        speed={10}
                    />
                </div>
            </section>

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