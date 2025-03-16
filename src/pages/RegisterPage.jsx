import React from "react";
import { Link } from "react-router-dom";
import { RegisterForm } from "@/components/auth/RegisterForm";
import "./css/RegisterPage.css";

/**
 * 注册页面组件
 * 展示用户注册表单
 */
const Register = () => {
    return (
        <div className="register-page">
            {/* 简化版导航栏，只有品牌logo */}
            <header className="auth-header">
                <div className="auth-header-container">
                    <Link to="/" className="auth-logo">
                        <img src="/assets/logo.svg" className="auth-logo-image" alt="梦境门户" />
                        <span className="auth-logo-text">梦境门户</span>
                    </Link>
                </div>
            </header>

            <div className="register-container">
                <div className="register-content">
                    <h1 className="register-title">注册账户</h1>
                    <p className="register-subtitle">
                        注册一个账户，开始记录和分享您的梦境体验吧
                    </p>
                    <RegisterForm />
                </div>

                {/* 背景装饰 */}
                <div className="bg-decoration bg-decoration-1"></div>
                <div className="bg-decoration bg-decoration-2"></div>
            </div>
        </div>
    );
};

export default Register; 