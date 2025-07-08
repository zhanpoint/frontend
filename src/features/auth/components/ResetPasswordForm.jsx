import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Phone, Mail, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Label } from "@/components/ui/label.jsx";
import passwordReset from "@/services/auth/passwordReset";
import { emailAuth } from "@/services/auth/emailAuth";
import { emailService } from "@/services/notification/email";
import notification from "@/utils/notification";
import { smsService } from "@/services/notification/sms";
import { isFeatureEnabled, getAvailableResetMethods } from "@/config/features";
import "./css/DreamTheme.css";

/**
 * 密码重置表单组件
 * 支持通过手机号或邮箱重置密码功能
 */
export function ResetPasswordForm() {
    const navigate = useNavigate();

    // 获取可用的重置方式
    const availableResetMethods = getAvailableResetMethods();

    // 重置方式状态 - 默认选择第一个可用的重置方式
    const [resetMode, setResetMode] = useState(availableResetMethods[0] || "email");

    // 手机号重置表单状态
    const [phoneFormData, setPhoneFormData] = useState({
        phone: "",
        verificationCode: "",
        newPassword: "",
        confirmPassword: ""
    });

    // 邮箱重置表单状态
    const [emailFormData, setEmailFormData] = useState({
        email: "",
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
    const [phoneCountdown, setPhoneCountdown] = useState(0);
    const [emailCountdown, setEmailCountdown] = useState(0);

    // 加载状态
    const [isLoading, setIsLoading] = useState(false);

    // 处理手机号表单变化
    const handlePhoneFormChange = (e) => {
        const { name, value } = e.target;
        setPhoneFormData({ ...phoneFormData, [name]: value });

        // 清除错误
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }

        // 检查确认密码
        if (name === "newPassword" && phoneFormData.confirmPassword) {
            if (value !== phoneFormData.confirmPassword) {
                setErrors({ ...errors, confirmPassword: "两次输入的密码不一致" });
            } else {
                setErrors({ ...errors, confirmPassword: "" });
            }
        }

        if (name === "confirmPassword") {
            if (value !== phoneFormData.newPassword) {
                setErrors({ ...errors, confirmPassword: "两次输入的密码不一致" });
            } else {
                setErrors({ ...errors, confirmPassword: "" });
            }
        }
    };

    // 处理邮箱表单变化
    const handleEmailFormChange = (e) => {
        const { name, value } = e.target;
        setEmailFormData({ ...emailFormData, [name]: value });

        // 清除错误
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }

        // 检查确认密码
        if (name === "newPassword" && emailFormData.confirmPassword) {
            if (value !== emailFormData.confirmPassword) {
                setErrors({ ...errors, confirmPassword: "两次输入的密码不一致" });
            } else {
                setErrors({ ...errors, confirmPassword: "" });
            }
        }

        if (name === "confirmPassword") {
            if (value !== emailFormData.newPassword) {
                setErrors({ ...errors, confirmPassword: "两次输入的密码不一致" });
            } else {
                setErrors({ ...errors, confirmPassword: "" });
            }
        }
    };

    // 验证手机号表单
    const validatePhoneForm = () => {
        const newErrors = {};

        // 手机号验证
        if (!phoneFormData.phone) {
            newErrors.phone = "请输入手机号";
        } else if (!/^1[3-9]\d{9}$/.test(phoneFormData.phone)) {
            newErrors.phone = "请输入有效的手机号";
        }

        // 验证码验证
        if (!phoneFormData.verificationCode) {
            newErrors.verificationCode = "请输入验证码";
        } else if (phoneFormData.verificationCode.length !== 6) {
            newErrors.verificationCode = "验证码为6位数字";
        }

        // 密码验证
        if (!phoneFormData.newPassword) {
            newErrors.newPassword = "请输入新密码";
        } else if (phoneFormData.newPassword.length < 8) {
            newErrors.newPassword = "密码长度至少为8个字符";
        } else if (phoneFormData.newPassword.length > 32) {
            newErrors.newPassword = "密码长度不能超过32个字符";
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,32}$/.test(phoneFormData.newPassword)) {
            newErrors.newPassword = "密码至少包含一个大写字母、一个小写字母和一个数字";
        }

        // 确认密码验证
        if (!phoneFormData.confirmPassword) {
            newErrors.confirmPassword = "请确认密码";
        } else if (phoneFormData.newPassword !== phoneFormData.confirmPassword) {
            newErrors.confirmPassword = "两次输入的密码不一致";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 验证邮箱表单
    const validateEmailForm = () => {
        const newErrors = {};

        // 邮箱验证
        if (!emailFormData.email) {
            newErrors.email = "请输入邮箱地址";
        } else if (!emailService.validateEmail(emailFormData.email)) {
            newErrors.email = "请输入有效的邮箱地址";
        }

        // 验证码验证
        if (!emailFormData.verificationCode) {
            newErrors.verificationCode = "请输入验证码";
        } else if (emailFormData.verificationCode.length !== 6) {
            newErrors.verificationCode = "验证码为6位数字";
        }

        // 密码验证
        if (!emailFormData.newPassword) {
            newErrors.newPassword = "请输入新密码";
        } else if (emailFormData.newPassword.length < 8) {
            newErrors.newPassword = "密码长度至少为8个字符";
        } else if (emailFormData.newPassword.length > 32) {
            newErrors.newPassword = "密码长度不能超过32个字符";
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,32}$/.test(emailFormData.newPassword)) {
            newErrors.newPassword = "密码至少包含一个大写字母、一个小写字母和一个数字";
        }

        // 确认密码验证
        if (!emailFormData.confirmPassword) {
            newErrors.confirmPassword = "请确认密码";
        } else if (emailFormData.newPassword !== emailFormData.confirmPassword) {
            newErrors.confirmPassword = "两次输入的密码不一致";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 发送手机验证码
    const handleSendPhoneVerificationCode = async () => {
        // 验证手机号
        if (!phoneFormData.phone) {
            setErrors({ ...errors, phone: "请输入手机号" });
            return;
        } else if (!/^1[3-9]\d{9}$/.test(phoneFormData.phone)) {
            setErrors({ ...errors, phone: "请输入有效的手机号" });
            return;
        }

        try {
            // 开始加载状态
            setIsLoading(true);

            // 使用smsService发送验证码，指定重置密码场景
            const response = await smsService.sendVerificationCode(phoneFormData.phone, 'reset_password');

            // 成功情况
            if (response.data.code === 200) {
                notification.success(response.data.message || "验证码发送成功，请查收短信");

                // 开始倒计时
                setPhoneCountdown(60);
                const timer = setInterval(() => {
                    setPhoneCountdown((prevCount) => {
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

    // 发送邮箱验证码
    const handleSendEmailVerificationCode = async () => {
        // 验证邮箱
        if (!emailFormData.email) {
            setErrors({ ...errors, email: "请输入邮箱地址" });
            return;
        } else if (!emailService.validateEmail(emailFormData.email)) {
            setErrors({ ...errors, email: "请输入有效的邮箱地址" });
            return;
        }

        try {
            // 开始加载状态
            setIsLoading(true);

            // 使用emailService发送验证码，指定重置密码场景
            const response = await emailService.sendVerificationCode(emailFormData.email, 'reset_password');

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

            // 显示错误信息
            if (error.response?.data?.message) {
                const errorMsg = error.response.data.message;
                setErrors({ ...errors, email: errorMsg });
                notification.error(errorMsg);
            } else {
                setErrors({ ...errors, email: "发送验证码失败，请稍后再试" });
                notification.error("发送验证码失败，请稍后再试");
            }
        } finally {
            // 结束加载状态
            setIsLoading(false);
        }
    };

    // 处理手机号重置密码提交
    const handlePhoneSubmit = async (e) => {
        e.preventDefault();

        if (!validatePhoneForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await passwordReset.resetPassword(
                phoneFormData.phone,
                phoneFormData.verificationCode,
                phoneFormData.newPassword
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

    // 处理邮箱重置密码提交
    const handleEmailSubmit = async (e) => {
        e.preventDefault();

        if (!validateEmailForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await emailAuth.resetPasswordWithEmail(
                emailFormData.email,
                emailFormData.verificationCode,
                emailFormData.newPassword
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
            console.error("邮箱密码重置失败:", error);

            const errorMsg = error.response?.data?.message || "密码重置失败，请稍后再试";
            setErrors({ general: errorMsg });
            notification.error(errorMsg);

            // 检查特定字段错误
            if (error.response?.data?.field === 'email') {
                setErrors(prev => ({ ...prev, email: error.response.data.message }));
            } else if (error.response?.data?.field === 'code') {
                setErrors(prev => ({ ...prev, verificationCode: error.response.data.message }));
            } else if (error.response?.data?.field === 'newPassword') {
                setErrors(prev => ({ ...prev, newPassword: error.response.data.message }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 跳转到登录页面
    const handleGoToLogin = () => {
        navigate("/login");
    };

    return (
        <Card className="w-full max-w-md mx-auto card">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center card-title">重置密码</CardTitle>
                <CardDescription className="text-center">
                    选择您的验证方式，重置您的账户密码
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={resetMode} onValueChange={setResetMode} className="w-full">
                    <TabsList className={`grid w-full tabs-list ${availableResetMethods.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                        }`}>
                        {isFeatureEnabled('SMS_SERVICE_ENABLED') && (
                            <TabsTrigger value="phone" className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                手机重置
                            </TabsTrigger>
                        )}
                        {isFeatureEnabled('EMAIL_SERVICE_ENABLED') && (
                            <TabsTrigger value="email" className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                邮箱重置
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* 手机号重置密码 */}
                    {isFeatureEnabled('SMS_SERVICE_ENABLED') && (
                        <TabsContent value="phone" className="space-y-4">
                            <form onSubmit={handlePhoneSubmit} className="space-y-4">
                                <div className="form-field">
                                    <Label htmlFor="phone" className="form-label">手机号</Label>
                                    <div className="input-container">
                                        <Phone className="input-icon" />
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="text"
                                            placeholder="请输入手机号"
                                            value={phoneFormData.phone}
                                            onChange={handlePhoneFormChange}
                                            className={`pl-10 ${errors.phone ? 'input-error' : ''}`}
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="error-message">{errors.phone}</p>
                                    )}
                                </div>

                                <div className="form-field">
                                    <Label htmlFor="phone-verificationCode" className="form-label">验证码</Label>
                                    <div className="verification-container">
                                        <div className="input-container flex-1">
                                            <Shield className="input-icon" />
                                            <Input
                                                id="phone-verificationCode"
                                                name="verificationCode"
                                                type="text"
                                                placeholder="请输入6位验证码"
                                                value={phoneFormData.verificationCode}
                                                onChange={handlePhoneFormChange}
                                                className={`verification-input ${errors.verificationCode ? 'input-error' : ''}`}
                                                maxLength="6"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={handleSendPhoneVerificationCode}
                                            disabled={phoneCountdown > 0 || isLoading}
                                            className="verification-button"
                                        >
                                            {phoneCountdown > 0 ? `${phoneCountdown}s` : "获取验证码"}
                                        </Button>
                                    </div>
                                    {errors.verificationCode && (
                                        <p className="error-message">{errors.verificationCode}</p>
                                    )}
                                </div>

                                <div className="form-field">
                                    <Label htmlFor="phone-newPassword" className="form-label">新密码</Label>
                                    <div className="input-container">
                                        <Lock className="input-icon" />
                                        <Input
                                            id="phone-newPassword"
                                            name="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="请输入新密码"
                                            value={phoneFormData.newPassword}
                                            onChange={handlePhoneFormChange}
                                            className={`pl-10 pr-10 ${errors.newPassword ? 'input-error' : ''}`}
                                        />
                                        <Button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </Button>
                                    </div>
                                    {errors.newPassword && (
                                        <p className="error-message">{errors.newPassword}</p>
                                    )}
                                </div>

                                <div className="form-field">
                                    <Label htmlFor="phone-confirmPassword" className="form-label">确认密码</Label>
                                    <div className="input-container">
                                        <Lock className="input-icon" />
                                        <Input
                                            id="phone-confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="请再次输入新密码"
                                            value={phoneFormData.confirmPassword}
                                            onChange={handlePhoneFormChange}
                                            className={`pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                                        />
                                        <Button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </Button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="error-message">{errors.confirmPassword}</p>
                                    )}
                                </div>

                                {errors.general && (
                                    <div className="error-message text-center">
                                        {errors.general}
                                    </div>
                                )}

                                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                                    {isLoading ? "重置中..." : "重置密码"}
                                </Button>
                            </form>
                        </TabsContent>
                    )}

                    {/* 邮箱重置密码 */}
                    {isFeatureEnabled('EMAIL_SERVICE_ENABLED') && (
                        <TabsContent value="email" className="space-y-4">
                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                <div className="form-field">
                                    <Label htmlFor="email" className="form-label">邮箱地址</Label>
                                    <div className="input-container">
                                        <Mail className="input-icon" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="请输入邮箱地址"
                                            value={emailFormData.email}
                                            onChange={handleEmailFormChange}
                                            className={`pl-10 ${errors.email ? 'input-error' : ''}`}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="error-message">{errors.email}</p>
                                    )}
                                </div>

                                <div className="form-field">
                                    <Label htmlFor="email-verificationCode" className="form-label">验证码</Label>
                                    <div className="verification-container">
                                        <div className="input-container flex-1">
                                            <Shield className="input-icon" />
                                            <Input
                                                id="email-verificationCode"
                                                name="verificationCode"
                                                type="text"
                                                placeholder="请输入6位验证码"
                                                value={emailFormData.verificationCode}
                                                onChange={handleEmailFormChange}
                                                className={`verification-input ${errors.verificationCode ? 'input-error' : ''}`}
                                                maxLength="6"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={handleSendEmailVerificationCode}
                                            disabled={emailCountdown > 0 || isLoading}
                                            className="verification-button"
                                        >
                                            {emailCountdown > 0 ? `${emailCountdown}s` : "获取验证码"}
                                        </Button>
                                    </div>
                                    {errors.verificationCode && (
                                        <p className="error-message">{errors.verificationCode}</p>
                                    )}
                                </div>

                                <div className="form-field">
                                    <Label htmlFor="email-newPassword" className="form-label">新密码</Label>
                                    <div className="input-container">
                                        <Lock className="input-icon" />
                                        <Input
                                            id="email-newPassword"
                                            name="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="请输入新密码"
                                            value={emailFormData.newPassword}
                                            onChange={handleEmailFormChange}
                                            className={`pl-10 pr-10 ${errors.newPassword ? 'input-error' : ''}`}
                                        />
                                        <Button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </Button>
                                    </div>
                                    {errors.newPassword && (
                                        <p className="error-message">{errors.newPassword}</p>
                                    )}
                                </div>

                                <div className="form-field">
                                    <Label htmlFor="email-confirmPassword" className="form-label">确认密码</Label>
                                    <div className="input-container">
                                        <Lock className="input-icon" />
                                        <Input
                                            id="email-confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="请再次输入新密码"
                                            value={emailFormData.confirmPassword}
                                            onChange={handleEmailFormChange}
                                            className={`pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                                        />
                                        <Button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </Button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="error-message">{errors.confirmPassword}</p>
                                    )}
                                </div>

                                {errors.general && (
                                    <div className="error-message text-center">
                                        {errors.general}
                                    </div>
                                )}

                                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                                    {isLoading ? "重置中..." : "重置密码"}
                                </Button>
                            </form>
                        </TabsContent>
                    )}
                </Tabs>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-center login-link">
                    记起密码了？{" "}
                    <button onClick={handleGoToLogin} className="text-primary hover:underline">
                        返回登录
                    </button>
                </div>
            </CardFooter>
        </Card>
    );
} 