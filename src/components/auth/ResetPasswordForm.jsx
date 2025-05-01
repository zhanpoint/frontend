import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";
import passwordReset from "@/services/auth/passwordReset";
import notification from "@/utils/notification";
import { smsService } from "@/services/notification/sms";
import "./css/ResetPasswordForm.css";

/**
 * 密码重置表单组件
 * 实现通过手机号重置密码功能
 */
export function ResetPasswordForm() {
    const navigate = useNavigate();

    // 表单状态
    const [formData, setFormData] = useState({
        phone: "",
        verificationCode: "",
        newPassword: "",
        confirmPassword: ""
    });

    // 错误信息状态
    const [errors, setErrors] = useState({});

    // 密码可见性状态
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // 验证码计时器状态
    const [countdown, setCountdown] = useState(0);

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

        // 手机号验证
        if (!formData.phone) {
            newErrors.phone = "请输入手机号";
        } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
            newErrors.phone = "请输入有效的手机号";
        }

        // 验证码验证
        if (!formData.verificationCode) {
            newErrors.verificationCode = "请输入验证码";
        } else if (formData.verificationCode.length !== 6) {
            newErrors.verificationCode = "验证码为6位数字";
        }

        // 密码验证
        if (!formData.newPassword) {
            newErrors.newPassword = "请输入新密码";
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = "密码长度至少为8个字符";
        } else if (formData.newPassword.length > 32) {
            newErrors.newPassword = "密码长度不能超过32个字符";
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,32}$/.test(formData.newPassword)) {
            newErrors.newPassword = "密码至少包含一个大写字母、一个小写字母和一个数字";
        }

        // 确认密码验证
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "请确认密码";
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = "两次输入的密码不一致";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 发送验证码
    const handleSendVerificationCode = async () => {
        // 验证手机号
        if (!formData.phone) {
            setErrors({ ...errors, phone: "请输入手机号" });
            return;
        } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
            setErrors({ ...errors, phone: "请输入有效的手机号" });
            return;
        }

        try {
            // 开始加载状态
            setIsLoading(true);

            // 使用smsService发送验证码，指定重置密码场景
            const response = await smsService.sendVerificationCode(formData.phone, 'reset_password');

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

            // 显示错误信息
            if (error.response?.data?.message) {
                const errorMsg = error.response.data.message;
                setErrors({ ...errors, phone: errorMsg });
                notification.error(errorMsg);
            } else {
                setErrors({ ...errors, phone: "发送验证码失败，请稍后再试" });
                notification.error("发送验证码失败，请稍后再试");
            }
        } finally {
            // 结束加载状态
            setIsLoading(false);
        }
    };

    // 提交表单
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await passwordReset.resetPassword(
                formData.phone,
                formData.verificationCode,
                formData.newPassword
            );

            if (response.data.code === 200) {
                notification.success(response.data.message || "密码重置成功！");
                // 跳转到登录页
                navigate("/login");
            } else {
                setErrors({ general: response.data.message || "密码重置失败" });
                notification.error(response.data.message || "密码重置失败");
            }
        } catch (error) {
            console.error("密码重置失败:", error);

            const errorMsg = error.response?.data?.message || "密码重置失败，请稍后再试";
            setErrors({ general: errorMsg });
            notification.error(errorMsg);

            // 检查特定字段错误
            if (error.response?.data?.field === 'phone') {
                setErrors(prev => ({ ...prev, phone: error.response.data.message }));
            } else if (error.response?.data?.field === 'code') {
                setErrors(prev => ({ ...prev, verificationCode: error.response.data.message }));
            } else if (error.response?.data?.field === 'newPassword') {
                setErrors(prev => ({ ...prev, newPassword: error.response.data.message }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-center">重置密码</CardTitle>
                <CardDescription className="text-center">
                </CardDescription>
            </CardHeader>
            <CardContent>
                {errors.general && (
                    <div className="p-3 mb-4 text-sm bg-red-900/20 border border-red-800/30 text-red-400 rounded-md">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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

                    {/* 新密码输入 */}
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">新密码</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="请输入新密码"
                                className={`pl-10 ${errors.newPassword ? "border-red-500" : ""}`}
                                value={formData.newPassword}
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
                        {errors.newPassword && (
                            <p className="text-sm text-red-500">{errors.newPassword}</p>
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

                    {/* 提交按钮 */}
                    <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={isLoading}
                    >
                        {isLoading ? "提交中..." : "重置密码"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button
                    variant="link"
                    onClick={() => navigate("/login")}
                    className="text-purple-600"
                >
                    返回登录
                </Button>
            </CardFooter>
        </Card>
    );
} 