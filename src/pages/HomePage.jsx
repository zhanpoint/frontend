import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Writer from '../components/ui/Writer.jsx';
import { DreamIntro } from '../components/DreamIntro';
import './css/HomePage.css';
import {SparklesCore} from "@/components/ui/sparkles.jsx";

/**
 * 梦境门户网站首页组件
 */
const HomePage = () => {
    const [buttonVisible, setButtonVisible] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // 打字机文本
    const welcomeTexts = [
        "欢迎来到Dream Log",
        "记录、分享和解析您的梦境，探索梦境的奥秘，与社区互动。"
    ];

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

    return (
        <>
            <div className="home-main">
                <div className="home-content">
                    {/* 打字机效果 */}
                    <div className="typewriter-wrapper">
                        <Writer
                            texts={welcomeTexts}
                            onComplete={handleTypingComplete}
                        />
                    </div>

                    {/* 探索按钮 */}
                    <div className={`fade-in ${buttonVisible ? 'visible' : ''}`}>
                        <div className="button-container">
                            <button
                                className="explore-button"
                                onClick={handleExploreClick}
                            >
                                开始探索
                            </button>
                        </div>
                    </div>
                </div>
                {/* 背景装饰 */}
                <div className="bg-decoration bg-decoration-1"></div>
                <div className="bg-decoration bg-decoration-2"></div>
            </div>
            {/* 新增：梦境介绍部分 */}
            <DreamIntro />

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
        </>
    );
};

export default HomePage; 