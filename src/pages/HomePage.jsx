import React, {useState} from 'react';
import Writer from '../components/common/Writer.jsx';
import './css/HomePage.css';

/**
 * 梦境门户网站首页组件
 */
const HomePage = () => {
    const [buttonVisible, setButtonVisible] = useState(false);

    // 打字机文本
    const welcomeTexts = [
        "欢迎来到梦境门户",
        "记录、分享和解析您的梦境，探索梦境的奥秘，与社区互动。"
    ];

    // 打字完成后显示按钮
    const handleTypingComplete = () => {
        setTimeout(() => setButtonVisible(true), 100);
    };

    return (
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
                        <button className="explore-button">
                            开始探索
                        </button>
                    </div>
                </div>
            </div>

            {/* 背景装饰 */}
            <div className="bg-decoration bg-decoration-1"></div>
            <div className="bg-decoration bg-decoration-2"></div>
        </div>
    );
};

export default HomePage; 