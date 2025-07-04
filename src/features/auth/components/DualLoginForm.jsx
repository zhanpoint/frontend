import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Eye, EyeOff, User, Lock, Phone, Mail } from "lucide-react";
import { smsService } from "@/services/notification/sms";
import { emailService } from "@/services/notification/email";
import { emailAuth } from "@/services/auth/emailAuth";
import notification from "@/utils/notification";
import smsAuth from "@/services/auth/smsAuth";
import { isFeatureEnabled, getAvailableLoginMethods } from "@/config/features";
import "./css/DreamTheme.css";

/**
 * 三模式登录表单组件
 * 支持用户名密码、手机号验证码、邮箱验证码三种登录方式
 */
export function DualLoginForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // 获取重定向地址（如果有）
    const from = location.state?.from?.pathname || "/";

    // 获取可用的登录方式
    const availableLoginMethods = getAvailableLoginMethods();

    // 登录模式状态 - 默认选择第一个可用的登录方式
    const [loginMode, setLoginMode] = useState(availableLoginMethods[0] || "password");

    // 用户名密码登录表单
    const [passwordForm, setPasswordForm] = useState({
        username: "",
        password: "",
    });

    // 手机号验证码登录表单
    const [smsForm, setSmsForm] = useState({
        phone: "",
        verificationCode: "",
    });

    // 邮箱验证码登录表单
    const [emailForm, setEmailForm] = useState({
        email: "",
        verificationCode: "",
    });

    // 错误信息状态
    const [errors, setErrors] = useState({});

    // 密码可见性
    const [showPassword, setShowPassword] = useState(false);

    // 验证码计时器状态
    const [smsCountdown, setSmsCountdown] = useState(0);
    const [emailCountdown, setEmailCountdown] = useState(0);

    // 加载状态
    const [isLoading, setIsLoading] = useState(false);

    // 处理用户名密码表单变化
    const handlePasswordFormChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm({ ...passwordForm, [name]: value });

        // 清除错误
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    // 处理短信验证码表单变化
    const handleSmsFormChange = (e) => {
        const { name, value } = e.target;
        setSmsForm({ ...smsForm, [name]: value });

        // 清除错误
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    // 处理邮箱验证码表单变化
    const handleEmailFormChange = (e) => {
        const { name, value } = e.target;
        setEmailForm({ ...emailForm, [name]: value });

        // 清除错误
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    // 验证密码登录表单
    const validatePasswordForm = () => {
        const newErrors = {};

        if (!passwordForm.username.trim()) {
            newErrors.username = "请输入用户名";
        } else if (passwordForm.username.length < 4) {
            newErrors.username = "用户名长度至少为4个字符";
        } else if (passwordForm.username.length > 16) {
            newErrors.username = "用户名长度不能超过16个字符";
        } else if (!/^[a-zA-Z0-9]{4,16}$/.test(passwordForm.username)) {
            newErrors.username = "用户名只能包含字母、数字，长度为4-16个字符";
        }

        if (!passwordForm.password) {
            newErrors.password = "请输入密码";
        } else if (passwordForm.password.length < 8) {
            newErrors.password = "密码长度至少为8个字符";
        } else if (passwordForm.password.length > 32) {
            newErrors.password = "密码长度不能超过32个字符";
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,32}$/.test(passwordForm.password)) {
            newErrors.password = "密码至少包含一个大写字母、一个小写字母和一个数字";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 验证短信登录表单
    const validateSmsForm = () => {
        const newErrors = {};

        if (!smsForm.phone) {
            newErrors.phone = "请输入手机号码";
        } else if (!/^1[3-9]\d{9}$/.test(smsForm.phone)) {
            newErrors.phone = "请输入有效的手机号码";
        }

        if (!smsForm.verificationCode) {
            newErrors.verificationCode = "请输入验证码";
        } else if (!/^\d{6}$/.test(smsForm.verificationCode)) {
            newErrors.verificationCode = "验证码为6位数字";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 验证邮箱登录表单
    const validateEmailForm = () => {
        const newErrors = {};

        if (!emailForm.email) {
            newErrors.email = "请输入邮箱地址";
        } else if (!emailService.validateEmail(emailForm.email)) {
            newErrors.email = "请输入有效的邮箱地址";
        }

        if (!emailForm.verificationCode) {
            newErrors.verificationCode = "请输入验证码";
        } else if (!/^\d{6}$/.test(emailForm.verificationCode)) {
            newErrors.verificationCode = "验证码为6位数字";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 发送短信验证码
    const handleSendSmsVerificationCode = async () => {
        // 验证手机号
        if (!smsForm.phone) {
            setErrors({ ...errors, phone: "请输入手机号码" });
            return;
        } else if (!/^1[3-9]\d{9}$/.test(smsForm.phone)) {
            setErrors({ ...errors, phone: "请输入有效的手机号码" });
            return;
        }

        try {
            // 开始加载状态
            setIsLoading(true);

            // 使用smsService发送验证码，指定登录场景
            const response = await smsService.sendVerificationCode(smsForm.phone, 'login');

            // 成功情况
            if (response.data.code === 200) {
                notification.success(response.data.message || "验证码发送成功，请查收短信");

                // 开始倒计时
                setSmsCountdown(60);
                const timer = setInterval(() => {
                    setSmsCountdown((prevCount) => {
                        if (prevCount <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prevCount - 1;
                    });
                }, 1000);
            } else {
                notification.warning(response.data.message || "验证码发送可能失败，请稍后再试");
            }
        } catch (error) {
            console.error("发送验证码失败:", error);

            const errorMessage = error.response?.data?.message || "发送验证码失败，请稍后再试";
            notification.error(errorMessage);

            if (error.response?.data?.field) {
                setErrors({ ...errors, [error.response.data.field]: errorMessage });
            } else {
                setErrors({ ...errors, phone: errorMessage });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 发送邮箱验证码
    const handleSendEmailVerificationCode = async () => {
        // 验证邮箱
        if (!emailForm.email) {
            setErrors({ ...errors, email: "请输入邮箱地址" });
            return;
        } else if (!emailService.validateEmail(emailForm.email)) {
            setErrors({ ...errors, email: "请输入有效的邮箱地址" });
            return;
        }

        try {
            // 开始加载状态
            setIsLoading(true);

            // 使用emailService发送验证码，指定登录场景
            const response = await emailService.sendVerificationCode(emailForm.email, 'login');

            // 成功情况
            if (response.data.code === 200) {
                notification.success(response.data.message || "验证码发送成功，请查收邮箱");

                // 开始倒计时
                setEmailCountdown(60);
                const timer = setInterval(() => {
                    setEmailCountdown((prevCount) => {
                        if (prevCount <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prevCount - 1;
                    });
                }, 1000);
            } else {
                notification.warning(response.data.message || "验证码发送可能失败，请稍后再试");
            }
        } catch (error) {
            console.error("发送邮箱验证码失败:", error);

            const errorMessage = error.response?.data?.message || "发送验证码失败，请稍后再试";
            notification.error(errorMessage);

            if (error.response?.data?.field) {
                setErrors({ ...errors, [error.response.data.field]: errorMessage });
            } else {
                setErrors({ ...errors, email: errorMessage });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 处理密码登录提交
    const handlePasswordLogin = async (e) => {
        e.preventDefault();

        if (!validatePasswordForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const result = await login(passwordForm.username, passwordForm.password);

            if (result.success) {
                navigate(from, { replace: true });
            } else {
                setErrors({ general: result.message });
            }
        } catch (error) {
            console.error("登录失败:", error);
            setErrors({ general: "登录过程中出错，请稍后重试" });
        } finally {
            setIsLoading(false);
        }
    };

    // 处理短信验证码登录提交
    const handleSmsLogin = async (e) => {
        e.preventDefault();

        if (!validateSmsForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await smsAuth.loginWithCode(smsForm.phone, smsForm.verificationCode);

            if (response.data.code === 200) {
                // 保存用户信息和令牌
                const { access, refresh, user } = response.data.data;
                localStorage.setItem('accessToken', access);
                localStorage.setItem('refreshToken', refresh);
                localStorage.setItem('user', JSON.stringify(user));

                notification.success("登录成功！");

                // 触发认证成功事件
                window.dispatchEvent(new CustomEvent('auth:login', { detail: user }));

                // 跳转到目标页面
                navigate(from, { replace: true });
            } else {
                setErrors({ general: response.data.message || "登录失败，请重试" });
            }
        } catch (error) {
            console.error("短信验证码登录失败:", error);

            const errorMessage = error.response?.data?.message || "登录失败，请重试";
            notification.error(errorMessage);

            if (error.response?.data?.field) {
                setErrors({ ...errors, [error.response.data.field]: errorMessage });
            } else {
                setErrors({ general: errorMessage });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 处理邮箱验证码登录提交
    const handleEmailLogin = async (e) => {
        e.preventDefault();

        if (!validateEmailForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await emailAuth.loginWithEmailCode(emailForm.email, emailForm.verificationCode);

            if (response.data.code === 200) {
                // 保存用户信息和令牌
                const { access, refresh, user } = response.data.data;
                localStorage.setItem('accessToken', access);
                localStorage.setItem('refreshToken', refresh);
                localStorage.setItem('user', JSON.stringify(user));

                notification.success("登录成功！");

                // 触发认证成功事件
                window.dispatchEvent(new CustomEvent('auth:login', { detail: user }));

                // 跳转到目标页面
                navigate(from, { replace: true });
            } else {
                setErrors({ general: response.data.message || "登录失败，请重试" });
            }
        } catch (error) {
            console.error("邮箱验证码登录失败:", error);

            const errorMessage = error.response?.data?.message || "登录失败，请重试";
            notification.error(errorMessage);

            if (error.response?.data?.field) {
                setErrors({ ...errors, [error.response.data.field]: errorMessage });
            } else {
                setErrors({ general: errorMessage });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 处理跳转到注册页面
    const handleGoToRegister = (e) => {
        e.preventDefault();
        navigate("/register");
    };

    // 处理跳转到忘记密码页面
    const handleGoToForgotPassword = (e) => {
        e.preventDefault();
        navigate("/forgot-password");
    };

    return (
        <Card className="w-full max-w-md mx-auto card">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center card-title">梦境门户</CardTitle>
                <CardDescription className="text-center">登录您的账户，开始梦想之旅</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={loginMode} onValueChange={setLoginMode} className="w-full">
                    <TabsList className={`grid w-full tabs-list ${availableLoginMethods.length === 1 ? 'grid-cols-1' :
                        availableLoginMethods.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                        }`}>
                        {isFeatureEnabled('PASSWORD_LOGIN_ENABLED') && (
                            <TabsTrigger value="password" className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                账号密码
                            </TabsTrigger>
                        )}
                        {isFeatureEnabled('SMS_SERVICE_ENABLED') && (
                            <TabsTrigger value="sms" className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                手机验证
                            </TabsTrigger>
                        )}
                        {isFeatureEnabled('EMAIL_SERVICE_ENABLED') && (
                            <TabsTrigger value="email" className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                邮箱验证
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* 密码登录 */}
                    {isFeatureEnabled('PASSWORD_LOGIN_ENABLED') && (
                        <TabsContent value="password" className="space-y-4">
                            <form onSubmit={handlePasswordLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">用户名</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="username"
                                            name="username"
                                            type="text"
                                            placeholder="请输入用户名"
                                            value={passwordForm.username}
                                            onChange={handlePasswordFormChange}
                                            className={`pl-10 input ${errors.username ? 'error-input' : ''}`}
                                        />
                                    </div>
                                    {errors.username && (
                                        <p className="text-sm text-red-500 error-message">{errors.username}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">密码</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="请输入密码"
                                            value={passwordForm.password}
                                            onChange={handlePasswordFormChange}
                                            className={`pl-10 pr-10 input ${errors.password ? 'error-input' : ''}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-red-500 error-message">{errors.password}</p>
                                    )}
                                </div>

                                {errors.general && (
                                    <div className="text-sm text-red-500 text-center error-message">
                                        {errors.general}
                                    </div>
                                )}

                                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                                    {isLoading ? "登录中..." : "登录"}
                                </Button>
                            </form>
                        </TabsContent>
                    )}

                    {/* 手机验证码登录 */}
                    {isFeatureEnabled('SMS_SERVICE_ENABLED') && (
                        <TabsContent value="sms" className="space-y-4">
                            <form onSubmit={handleSmsLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">手机号</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="text"
                                            placeholder="请输入手机号"
                                            value={smsForm.phone}
                                            onChange={handleSmsFormChange}
                                            className={`pl-10 input ${errors.phone ? 'error-input' : ''}`}
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="text-sm text-red-500 error-message">{errors.phone}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="verificationCode">验证码</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="verificationCode"
                                            name="verificationCode"
                                            type="text"
                                            placeholder="请输入6位验证码"
                                            value={smsForm.verificationCode}
                                            onChange={handleSmsFormChange}
                                            className={`input ${errors.verificationCode ? 'error-input' : ''}`}
                                            maxLength={6}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleSendSmsVerificationCode}
                                            disabled={smsCountdown > 0 || isLoading}
                                            className="verification-button"
                                        >
                                            {smsCountdown > 0 ? `${smsCountdown}s` : "获取验证码"}
                                        </Button>
                                    </div>
                                    {errors.verificationCode && (
                                        <p className="text-sm text-red-500 error-message">{errors.verificationCode}</p>
                                    )}
                                </div>

                                {errors.general && (
                                    <div className="text-sm text-red-500 text-center error-message">
                                        {errors.general}
                                    </div>
                                )}

                                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                                    {isLoading ? "登录中..." : "登录"}
                                </Button>
                            </form>
                        </TabsContent>
                    )}

                    {/* 邮箱验证码登录 */}
                    {isFeatureEnabled('EMAIL_SERVICE_ENABLED') && (
                        <TabsContent value="email" className="space-y-4">
                            <form onSubmit={handleEmailLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">邮箱地址</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="请输入邮箱地址"
                                            value={emailForm.email}
                                            onChange={handleEmailFormChange}
                                            className={`pl-10 input ${errors.email ? 'error-input' : ''}`}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-sm text-red-500 error-message">{errors.email}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="emailVerificationCode">验证码</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="emailVerificationCode"
                                            name="verificationCode"
                                            type="text"
                                            placeholder="请输入6位验证码"
                                            value={emailForm.verificationCode}
                                            onChange={handleEmailFormChange}
                                            className={`input ${errors.verificationCode ? 'error-input' : ''}`}
                                            maxLength={6}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleSendEmailVerificationCode}
                                            disabled={emailCountdown > 0 || isLoading}
                                            className="verification-button"
                                        >
                                            {emailCountdown > 0 ? `${emailCountdown}s` : "获取验证码"}
                                        </Button>
                                    </div>
                                    {errors.verificationCode && (
                                        <p className="text-sm text-red-500 error-message">{errors.verificationCode}</p>
                                    )}
                                </div>

                                {errors.general && (
                                    <div className="text-sm text-red-500 text-center error-message">
                                        {errors.general}
                                    </div>
                                )}

                                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                                    {isLoading ? "登录中..." : "登录"}
                                </Button>
                            </form>
                        </TabsContent>
                    )}
                </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-center space-y-1">
                    <button
                        onClick={handleGoToForgotPassword}
                        className="text-primary hover:underline"
                    >
                        忘记密码？
                    </button>
                </div>
                <div className="text-sm text-center">
                    还没有账户？{" "}
                    <button
                        onClick={handleGoToRegister}
                        className="text-primary hover:underline font-medium"
                    >
                        立即注册
                    </button>
                </div>
            </CardFooter>
        </Card>
    );
}

export default DualLoginForm; 