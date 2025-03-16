import React from "react";
import { Link } from "react-router-dom";
import { DualLoginForm } from "@/components/auth/DualLoginForm";
import "./css/LoginPage.css";

/**
 * 登录页面组件
 */
export function LoginPage() {
    return (
        <div className="login-page">
            {/* 简化版导航栏，只有品牌logo */}
            <header className="auth-header">
                <div className="auth-header-container">
                    <Link to="/" className="auth-logo">
                        <img src="/assets/logo.svg" className="auth-logo-image" alt="梦境门户" />
                        <span className="auth-logo-text">梦境门户</span>
                    </Link>
                </div>
            </header>

            <div className="login-container">
                <div className="login-content">
                    <div className="login-header">
                        <h1 className="login-title">梦境门户</h1>
                        <p className="login-subtitle">登录您的账户开始探索奇妙世界</p>
                    </div>

                    <DualLoginForm />

                    <div className="login-footer">
                        登录即表示您同意我们的
                        <Link to="/terms" className="mx-1">服务条款</Link>
                        和
                        <Link to="/privacy" className="mx-1">隐私政策</Link>
                    </div>
                </div>

                {/* 背景装饰元素 */}
                <div className="bg-decoration bg-decoration-1"></div>
                <div className="bg-decoration bg-decoration-2"></div>
            </div>
        </div>
    );
}

export default LoginPage; 