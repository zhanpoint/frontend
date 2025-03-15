import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import notification from "@/utils/notification";
import "./css/LoginForm.css";

/**
 * 登录表单组件
 */
export function LoginForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // 获取重定向地址（如果有）
    const from = location.state?.from?.pathname || "/";

    // 表单状态
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    // 错误信息状态
    const [errors, setErrors] = useState({});

    // 密码可见性状态
    const [showPassword, setShowPassword] = useState(false);

    // 加载状态
    const [isLoading, setIsLoading] = useState(false);

    // 处理输入变化
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // 清除错误
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    // 验证表单
    const validateForm = () => {
        const newErrors = {};

        // 用户名验证
        if (!formData.username.trim()) {
            newErrors.username = "请输入用户名";
        }

        // 密码验证
        if (!formData.password) {
            newErrors.password = "请输入密码";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 提交表单
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 验证表单
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // 调用登录方法
            const result = await login(formData.username, formData.password);

            if (result.success) {
                // 登录成功，重定向到来源页或首页
                notification.success(`欢迎回来，${formData.username}！`);
                navigate(from, { replace: true });
            } else {
                // 登录失败，显示错误
                setErrors({ general: result.message });
            }
        } catch (error) {
            console.error("登录过程中出错:", error);
            setErrors({ general: "登录过程中出错，请稍后重试" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="login-form" onSubmit={handleSubmit}>
            {/* 通用错误信息 */}
            {errors.general && (
                <div className="general-error">{errors.general}</div>
            )}

            {/* 用户名 */}
            <div className="form-field">
                <label className="form-label" htmlFor="username">
                    用户名
                </label>
                <div className="input-container">
                    <User className="input-icon" size={18} />
                    <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="请输入用户名"
                        value={formData.username}
                        onChange={handleChange}
                        className={errors.username ? "input-error" : ""}
                        autoComplete="username"
                    />
                </div>
                {errors.username && <div className="error-message">{errors.username}</div>}
            </div>

            {/* 密码 */}
            <div className="form-field">
                <label className="form-label" htmlFor="password">
                    密码
                </label>
                <div className="input-container">
                    <Lock className="input-icon" size={18} />
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="请输入密码"
                        value={formData.password}
                        onChange={handleChange}
                        className={errors.password ? "input-error" : ""}
                        autoComplete="current-password"
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            {/* 登录按钮 */}
            <Button
                type="submit"
                className="login-button"
                disabled={isLoading}
            >
                {isLoading ? "登录中..." : "登录"}
            </Button>

            {/* 注册链接 */}
            <div className="register-link">
                还没有账号？
                <a href="/register" onClick={(e) => {
                    e.preventDefault();
                    navigate("/register");
                }}>
                    立即注册
                </a>
            </div>

            {/* 忘记密码链接 */}
            <div className="forgot-password">
                <a href="/forgot-password" onClick={(e) => {
                    e.preventDefault();
                    navigate("/forgot-password");
                }}>
                    忘记密码？
                </a>
            </div>
        </form>
    );
} 