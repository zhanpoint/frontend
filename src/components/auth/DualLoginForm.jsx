import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, User, Lock, Phone, Mail } from "lucide-react";
import { smsService } from "@/services/notification/sms";
import notification from "@/utils/notification";
import smsAuth from "@/services/auth/smsAuth";

/**
 * 双模式登录表单组件
 * 支持用户名密码和手机号验证码两种登录方式
 */
export function DualLoginForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // 获取重定向地址（如果有）
    const from = location.state?.from?.pathname || "/";

    // 登录模式状态
    const [loginMode, setLoginMode] = useState("password"); // "password" 或 "sms"

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

    // 错误信息状态
    const [errors, setErrors] = useState({});

    // 密码可见性
    const [showPassword, setShowPassword] = useState(false);

    // 验证码计时器状态
    const [countdown, setCountdown] = useState(0);

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

    // 发送验证码
    const handleSendVerificationCode = async () => {
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

            // 使用smsService发送验证码
            const response = await smsService.sendVerificationCode(smsForm.phone);

            // 成功情况
            if (response.data.code === 200) {
                notification.success(response.data.message || "验证码发送成功，请查收短信");

                // 开始倒计时
                setCountdown(60);
                const timer = setInterval(() => {
                    setCountdown((prevCount) => {
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

    // 处理短信登录提交
    const handleSmsLogin = async (e) => {
        e.preventDefault();

        if (!validateSmsForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // 调用短信登录API
            const response = await smsAuth.loginWithCode(smsForm.phone, smsForm.verificationCode);

            if (response.data.code === 200 || response.data.code === 201) {
                // 获取用户名用于显示欢迎信息
                const userData = response.data.data;
                if (userData && userData.username) {
                    notification.success(`登录成功，欢迎回来，${userData.username}！`);
                }

                // 跳转到原页面或首页
                navigate(from, { replace: true });
            } else {
                // 登录失败，显示后端返回的错误信息
                setErrors({ general: response.data.message || "登录失败" });
            }
        } catch (error) {
            console.error("短信登录失败:", error);

            // 显示具体错误信息（如果有）
            const errorMessage = error.response?.data?.message || "登录过程中出错，请稍后重试";
            setErrors({ general: errorMessage });

            // 检查是否有字段错误
            if (error.response?.data?.field === 'phone') {
                setErrors(prev => ({ ...prev, phone: error.response.data.message }));
            } else if (error.response?.data?.field === 'code') {
                setErrors(prev => ({ ...prev, verificationCode: error.response.data.message }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 切换到注册页面
    const handleGoToRegister = (e) => {
        e.preventDefault();
        navigate("/register");
    };

    // 切换到忘记密码页面
    const handleGoToForgotPassword = (e) => {
        e.preventDefault();
        navigate("/forgot-password");
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">

            <Tabs value={loginMode} onValueChange={setLoginMode} className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="password">账号密码</TabsTrigger>
                    <TabsTrigger value="sms">手机验证码</TabsTrigger>
                </TabsList>

                {/* 密码登录表单 */}
                <TabsContent value="password">
                    <CardContent className="space-y-4">
                        {errors.general && (
                            <div className="p-3 text-sm bg-red-900/20 border border-red-800/30 text-red-400 rounded-md">
                                {errors.general}
                            </div>
                        )}

                        <form onSubmit={handlePasswordLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">用户名</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        name="username"
                                        placeholder="请输入用户名"
                                        className="pl-10"
                                        value={passwordForm.username}
                                        onChange={handlePasswordFormChange}
                                        autoComplete="username"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="text-sm text-red-500">{errors.username}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">密码</Label>
                                    <Button
                                        variant="link"
                                        className="px-0 text-xs text-purple-600 hover:text-purple-700"
                                        onClick={handleGoToForgotPassword}
                                    >
                                        忘记密码?
                                    </Button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="请输入密码"
                                        className="pl-10"
                                        value={passwordForm.password}
                                        onChange={handlePasswordFormChange}
                                        autoComplete="current-password"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
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
                                    <p className="text-sm text-red-500">{errors.password}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? "登录中..." : "登录"}
                            </Button>
                        </form>
                    </CardContent>
                </TabsContent>

                {/* 短信登录表单 */}
                <TabsContent value="sms">
                    <CardContent className="space-y-4">
                        {errors.general && (
                            <div className="p-3 text-sm bg-red-900/20 border border-red-800/30 text-red-400 rounded-md">
                                {errors.general}
                            </div>
                        )}

                        <form onSubmit={handleSmsLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">手机号码</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        name="phone"
                                        placeholder="请输入手机号码"
                                        className="pl-10"
                                        value={smsForm.phone}
                                        onChange={handleSmsFormChange}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-sm text-red-500">{errors.phone}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="verificationCode">验证码</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="verificationCode"
                                            name="verificationCode"
                                            placeholder="请输入验证码"
                                            className="pl-10"
                                            value={smsForm.verificationCode}
                                            onChange={handleSmsFormChange}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSendVerificationCode}
                                        disabled={countdown > 0 || isLoading}
                                        className="w-32 flex-shrink-0"
                                    >
                                        {isLoading
                                            ? "发送中..."
                                            : countdown > 0
                                                ? `${countdown}秒后重发`
                                                : "获取验证码"}
                                    </Button>
                                </div>
                                {errors.verificationCode && (
                                    <p className="text-sm text-red-500">{errors.verificationCode}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? "登录中..." : "登录"}
                            </Button>
                        </form>
                    </CardContent>
                </TabsContent>
            </Tabs>

            <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-center text-muted-foreground">
                    还没有账号？
                    <Button
                        variant="link"
                        className="pl-1"
                        onClick={handleGoToRegister}
                    >
                        立即注册
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

export default DualLoginForm; 