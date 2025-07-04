import React from "react";
import { Link } from "react-router-dom";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import "@/styles/features/auth.css";

/**
 * 注册页面组件
 * 展示用户注册表单
 */
function Register() {
    return (
        <div className="auth-page">
            {/* 简化版导航栏，只有品牌logo */}
            <header className="auth-header">
                <div className="auth-header-container">
                    <Link to="/" className="auth-logo">
                        <img src="/assets/logo.svg" className="auth-logo-image" alt="梦境门户" />
                        <span className="auth-logo-text">梦境门户</span>
                    </Link>
                </div>
            </header>

            <div className="auth-container">
                <div className="auth-content">
                    <RegisterForm />
                </div>

                {/* 背景装饰 */}
                <div className="bg-decoration bg-decoration-1"></div>
                <div className="bg-decoration bg-decoration-2"></div>
                <div className="bg-decoration bg-decoration-3"></div>
            </div>
        </div>
    );
}

export { Register };
export default Register; 