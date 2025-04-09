import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Writer from '../components/ui/Writer.jsx';
import { DreamIntro } from '../components/DreamIntro';
import './css/HomePage.css';
import { SparklesCore } from "@/components/ui/sparkles.jsx";
import { motion } from "framer-motion";

/**
 * 梦境门户网站首页组件
 */
const HomePage = () => {
    const [buttonVisible, setButtonVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // 打字机文本
    const welcomeTexts = [
        "欢迎来到Dream Log",
        "记录、分享和解析您的梦境，探索梦境的奥秘，与社区互动。"
    ];

    // 页面加载完成后设置状态
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // 打字完成后显示按钮
    const handleTypingComplete = () => {
        setTimeout(() => setButtonVisible(true), 100);
    };

    // 探索按钮点击事件处理
    const handleExploreClick = () => {
        if (isAuthenticated) {
            // 已登录，跳转到创建梦境页面
            navigate('/create-post');
        } else {
            // 未登录，跳转到登录页面，并记录来源页面
            navigate('/login', { state: { from: '/create-post' } });
        }
    };

    // 主题特点数据
    const features = [
        {
            icon: "✨",
            title: "记录梦境",
            description: "使用直观的工具记录您的梦境内容和感受"
        },
        {
            icon: "🔍",
            title: "解析意义",
            description: "运用科学方法解读梦境，发现潜意识信息"
        },
        {
            icon: "👥",
            title: "分享体验",
            description: "与全球梦境爱好者交流，探讨相似体验"
        }
    ];

    return (
        <div className="home-page">
            {/* 主视觉区域 */}
            <section className="hero-section">
                <div className="hero-content">
                    <motion.div
                        className="hero-text-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {/* 打字机效果 */}
                        <div className="typewriter-wrapper">
                            <Writer
                                texts={welcomeTexts}
                                onComplete={handleTypingComplete}
                            />
                        </div>

                        {/* 探索按钮 */}
                        <motion.div
                            className={`fade-in ${buttonVisible ? 'visible' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: buttonVisible ? 1 : 0, y: buttonVisible ? 0 : 20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="button-container">
                                <button
                                    className="primary-button"
                                    onClick={handleExploreClick}
                                >
                                    <span className="button-text">开始探索</span>
                                    <span className="button-icon">→</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* 视觉元素 - 梦境图像 */}
                    <motion.div
                        className="hero-image-container"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.9 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        <img
                            src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="梦境风景"
                            className="hero-image"
                        />
                    </motion.div>
                </div>

                {/* 星光粒子效果 */}
                <div className="sparkles-container">
                    <SparklesCore
                        minSize={1.0}
                        maxSize={2.0}
                        particleDensity={60}
                        className="w-full h-full"
                        particleColor="#FFFFFF"
                        speed={8}
                    />
                </div>
            </section>

            {/* 特点展示部分 */}
            <section className="features-section">
                <motion.div
                    className="section-title"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                >
                    <h2>探索梦境的奇妙世界</h2>
                    <p>Dream Log 为您提供完整的梦境管理和分析体验</p>
                </motion.div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="feature-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                        >
                            <div className="feature-icon">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 梦境介绍部分 */}
            <DreamIntro />

            {/* 号召性行动区 */}
            <section className="cta-section">
                <motion.div
                    className="cta-content"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                >
                    <h2>开始您的梦境旅程</h2>
                    <p>加入Dream Log，记录并理解您的梦境世界</p>
                    <button
                        className="cta-button"
                        onClick={handleExploreClick}
                    >
                        立即体验
                    </button>
                </motion.div>
                <div className="cta-background-glow"></div>
            </section>
        </div>
    );
};

export default HomePage; 