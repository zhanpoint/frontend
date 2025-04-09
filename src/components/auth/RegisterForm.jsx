import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, User, Lock, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import notification from "@/utils/notification";
import { smsService } from "@/services/notification/sms";
import { smsAuth } from "@/services/auth/smsAuth";
import "./css/RegisterForm.css";

/**
 * 注册表单组件
 * 包含用户名、密码、重复密码、手机号、验证码等字段
 */
export function RegisterForm() {
    const navigate = useNavigate();

    // 表单状态
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        phone: "",
        verificationCode: "",
    });

    // 错误信息状态
    const [errors, setErrors] = useState({});

    // 密码可见性状态
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // 验证码计时器状态
    const [countdown, setCountdown] = useState(0);

    // 发送请求状态
    const [isLoading, setIsLoading] = useState(false);

    // 处理输入变化
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // 清除相关字段的错误
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }

        // 如果修改了密码，检查确认密码
        if (name === "password" && formData.confirmPassword) {
            if (value !== formData.confirmPassword) {
                setErrors({ ...errors, confirmPassword: "两次输入的密码不一致" });
            } else {
                setErrors({ ...errors, confirmPassword: "" });
            }
        }

        // 如果修改了确认密码，检查与密码是否一致
        if (name === "confirmPassword") {
            if (value !== formData.password) {
                setErrors({ ...errors, confirmPassword: "两次输入的密码不一致" });
            } else {
                setErrors({ ...errors, confirmPassword: "" });
            }
        }
    };

    // 验证表单
    const validateForm = () => {
        const newErrors = {};

        // 用户名验证
        if (!formData.username.trim()) {
            newErrors.username = "请输入用户名";
        } else if (formData.username.length < 4) {
            newErrors.username = "用户名长度至少为4个字符";
        } else if (formData.username.length > 16) {
            newErrors.username = "用户名长度不能超过16个字符";
        } else if (!/^[a-zA-Z0-9]{4,16}$/.test(formData.username)) {
            newErrors.username = "用户名只能包含字母、数字，长度为4-16个字符";
        }

        // 密码验证
        if (!formData.password) {
            newErrors.password = "请输入密码";
        } else if (formData.password.length < 8) {
            newErrors.password = "密码长度至少为8个字符";
        } else if (formData.password.length > 32) {
            newErrors.password = "密码长度不能超过32个字符";
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,32}$/.test(formData.password)) {
            newErrors.password = "密码至少包含一个大写字母、一个小写字母和一个数字";
        }

        // 确认密码验证
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "请确认密码";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "两次输入的密码不一致";
        }

        // 手机号验证
        if (!formData.phone) {
            newErrors.phone = "请输入手机号+86";
        } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
            newErrors.phone = "请输入有效的手机号";
        }

        // 验证码验证
        if (!formData.verificationCode) {
            newErrors.verificationCode = "请输入验证码";
        } else if (formData.verificationCode.length !== 6) {
            newErrors.verificationCode = "验证码为6位数字";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 发送验证码
    const handleSendVerificationCode = async () => {
        // 验证手机号
        if (!formData.phone) {
            setErrors({ ...errors, phone: "请输入手机号+86" });
            return;
        } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
            setErrors({ ...errors, phone: "请输入有效的手机号" });
            return;
        }

        try {
            // 开始加载状态
            setIsLoading(true);

            // 使用smsService发送验证码
            const response = await smsService.sendVerificationCode(formData.phone);

            // 检查响应状态和消息
            console.log("验证码请求响应:", response.data);

            // 成功情况 - 响应码200
            if (response.data.code === 200) {
                // 显示成功信息
                notification.success(response.data.message || "验证码发送成功");

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
                // 处理非200但也不是错误的情况
                setErrors({
                    ...errors,
                    phone: response.data.message || "验证码发送可能失败，请稍后再试"
                });
                notification.warning(response.data.message || "验证码发送可能失败，请稍后再试");
            }
        } catch (error) {
            // 请求失败
            console.error("发送验证码失败:", error);

            if (error.response) {
                // 服务器返回了错误响应
                const responseData = error.response.data;

                // 显示后端返回的错误信息
                if (responseData && responseData.message) {
                    setErrors({ ...errors, phone: responseData.message });
                    notification.error(responseData.message);
                } else if (error.response.status === 500) {
                    setErrors({ ...errors, phone: "验证码发送失败，请稍后再试" });
                    notification.error("服务器内部错误，请稍后再试");
                } else {
                    setErrors({ ...errors, phone: `请求失败 (${error.response.status})` });
                    notification.error(`请求失败 (${error.response.status})`);
                }
            } else if (error.request) {
                // 请求发送了但没有收到响应
                setErrors({ ...errors, phone: "网络错误，请检查您的网络连接" });
                notification.error("网络错误，请检查您的网络连接");
            } else {
                // 请求设置时发生错误
                setErrors({ ...errors, phone: "发送请求出错" });
                notification.error("发送请求出错");
            }
        } finally {
            // 结束加载状态
            setIsLoading(false);
        }
    };

    // 提交表单
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 首先验证表单
        if (!validateForm()) {
            return;
        }

        // 显示加载状态
        setIsLoading(true);

        try {
            // 调用注册API，一步完成带验证码的注册
            const response = await smsAuth.registerWithCode(
                formData.username,
                formData.password,
                formData.phone,
                formData.verificationCode
            );

            // 检查响应
            console.log("注册请求响应:", response.data);

            // 处理响应 - 同时处理200和201状态码作为成功
            if (response.data.code === 200 || response.data.code === 201) {
                // 注册成功
                console.log("注册成功:", response.data.message);

                // 存储令牌（如果后端返回了令牌）
                if (response.data.access && response.data.refresh) {
                    localStorage.setItem('accessToken', response.data.access);
                    localStorage.setItem('refreshToken', response.data.refresh);
                    console.log("令牌已存储");
                }

                // 存储用户信息（如果有）
                if (response.data.data) {
                    localStorage.setItem('user', JSON.stringify(response.data.data));
                }

                // 显示成功消息
                notification.success(response.data.message || "注册成功！欢迎加入梦境门户！");

                // 跳转到首页
                navigate("/");
            } else {
                // 其他非错误但不是成功的情况
                notification.warning(response.data.message || "注册过程中出现问题，请稍后重试");
            }
        } catch (error) {
            // 请求失败
            console.error("注册失败:", error);

            // 显示错误消息
            if (error.response) {
                // 服务器返回了错误响应
                const responseData = error.response.data;

                if (responseData && responseData.message) {
                    if (responseData.field) {
                        // 特定字段的错误
                        setErrors({ ...errors, [responseData.field]: responseData.message });
                        notification.error(`${responseData.field}错误: ${responseData.message}`);
                    } else {
                        // 一般错误
                        notification.error(responseData.message);
                    }
                } else if (error.response.status === 500) {
                    notification.error("服务器内部错误，请稍后重试");
                } else {
                    notification.error(`注册失败 (${error.response.status})`);
                }
            } else if (error.request) {
                // 请求发送了但没有收到响应
                notification.error("网络错误，请检查您的网络连接");
            } else {
                // 请求设置时发生错误
                notification.error("发送请求出错");
            }
        } finally {
            // 结束加载状态
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader>
            </CardHeader>
            <CardContent>
                {errors.general && (
                    <div className="p-3 mb-4 text-sm bg-red-900/20 border border-red-800/30 text-red-400 rounded-md">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 用户名输入 */}
                    <div className="space-y-2">
                        <Label htmlFor="username">用户名</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="请输入用户名"
                                className={`pl-10 ${errors.username ? "border-red-500" : ""}`}
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>
                        {errors.username && (
                            <p className="text-sm text-red-500">{errors.username}</p>
                        )}
                    </div>

                    {/* 密码输入 */}
                    <div className="space-y-2">
                        <Label htmlFor="password">密码</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="请输入密码"
                                className={`pl-10 ${errors.password ? "border-red-500" : ""}`}
                                value={formData.password}
                                onChange={handleChange}
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

                    {/* 确认密码输入 */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">确认密码</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="请再次输入密码"
                                className={`pl-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                        )}
                    </div>

                    {/* 手机号输入 */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">手机号</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="phone"
                                name="phone"
                                type="text"
                                placeholder="请输入手机号"
                                className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                        {errors.phone && (
                            <p className="text-sm text-red-500">{errors.phone}</p>
                        )}
                    </div>

                    {/* 验证码输入 */}
                    <div className="space-y-2">
                        <Label htmlFor="verificationCode">验证码</Label>
                        <div className="flex gap-2">
                            <Input
                                id="verificationCode"
                                name="verificationCode"
                                type="text"
                                placeholder="请输入验证码"
                                className={`flex-1 ${errors.verificationCode ? "border-red-500" : ""}`}
                                value={formData.verificationCode}
                                onChange={handleChange}
                            />
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

                    {/* 注册按钮 */}
                    <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={isLoading}
                    >
                        {isLoading ? "注册中..." : "注册"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <div className="text-sm text-center text-muted-foreground">
                    已有账号？
                    <Button
                        variant="link"
                        className="pl-1 text-purple-600"
                        onClick={() => navigate("/login")}
                    >
                        立即登录
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
} 