import React from "react";
import { Link } from "react-router-dom";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import "./css/ResetPasswordPage.css";

/**
 * 重置密码页面组件
 */
export function ResetPasswordPage() {
    return (
        <div className="reset-password-page">
            {/* 简化版导航栏，只有品牌logo */}
            <header className="auth-header">
                <div className="auth-header-container">
                    <Link to="/" className="auth-logo">
                        <img src="/assets/logo.svg" className="auth-logo-image" alt="梦境门户" />
                        <span className="auth-logo-text">梦境门户</span>
                    </Link>
                </div>
            </header>

            <div className="reset-password-container">
                <div className="reset-password-content">
                    <ResetPasswordForm />
                </div>

                {/* 背景装饰元素 */}
                <div className="bg-decoration bg-decoration-1"></div>
                <div className="bg-decoration bg-decoration-2"></div>
            </div>
        </div>
    );
}

export default ResetPasswordPage; 