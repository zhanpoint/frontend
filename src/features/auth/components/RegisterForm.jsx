import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Eye, EyeOff, User, Lock, Phone, Mail, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Label } from "@/components/ui/label.jsx";
import notification from "@/utils/notification";
import { smsService } from "@/services/notification/sms";
import { emailService } from "@/services/notification/email";
import { smsAuth } from "@/services/auth/smsAuth";
import { emailAuth } from "@/services/auth/emailAuth";
import { isFeatureEnabled, getAvailableRegisterMethods } from "@/config/features";
import "./css/DreamTheme.css";
import { useAuth } from "@/hooks/useAuth";

/**
 * 注册表单组件
 * 支持手机号和邮箱两种注册方式
 */
export function RegisterForm() {
    const navigate = useNavigate();
    const { registerUser } = useAuth();

    // 获取可用的注册方式
    const availableRegisterMethods = getAvailableRegisterMethods();

    // 注册方式状态 - 默认选择第一个可用的注册方式
    const [registerMode, setRegisterMode] = useState(availableRegisterMethods[0] || "email");

    // 手机号注册表单状态
    const [phoneFormData, setPhoneFormData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        phone: "",
        verificationCode: "",
    });

    // 邮箱注册表单状态
    const [emailFormData, setEmailFormData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
        verificationCode: "",
    });

    // 错误信息状态
    const [errors, setErrors] = useState({});

    // 密码可见性状态
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // 验证码计时器状态
    const [phoneCountdown, setPhoneCountdown] = useState(0);
    const [emailCountdown, setEmailCountdown] = useState(0);

    // 发送请求状态
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingPhoneCode, setIsSendingPhoneCode] = useState(false);
    const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);

    // 新添加的状态
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    // 为邮箱验证码添加倒计时效果
    useEffect(() => {
        let timer;
        if (emailCountdown > 0) {
            timer = setInterval(() => {
                setEmailCountdown((prevCount) => {
                    if (prevCount <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prevCount - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [emailCountdown]);

    // 为手机验证码添加倒计时效果
    useEffect(() => {
        let timer;
        if (phoneCountdown > 0) {
            timer = setInterval(() => {
                setPhoneCountdown((prevCount) => {
                    if (prevCount <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prevCount - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [phoneCountdown]);

    // 处理手机号注册表单变化
    const handlePhoneFormChange = (e) => {
        const { name, value } = e.target;
        setPhoneFormData({ ...phoneFormData, [name]: value });

        // 清除相关字段的错误
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }

        // 如果修改了密码，检查确认密码
        if (name === "password" && phoneFormData.confirmPassword) {
            if (value !== phoneFormData.confirmPassword) {
                setErrors({ ...errors, confirmPassword: "两次输入的密码不一致" });
            } else {
                setErrors({ ...errors, confirmPassword: "" });
            }
        }

        // 如果修改了确认密码，检查与密码是否一致
        if (name === "confirmPassword") {
            if (value !== phoneFormData.password) {
                setErrors({ ...errors, confirmPassword: "两次输入的密码不一致" });
            } else {
                setErrors({ ...errors, confirmPassword: "" });
            }
        }
    };

    // 处理邮箱注册表单变化
    const handleEmailFormChange = (e) => {
        const { name, value } = e.target;
        setEmailFormData({ ...emailFormData, [name]: value });

        // 清除相关字段的错误
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }

        // 如果修改了密码，检查确认密码
        if (name === "password" && emailFormData.confirmPassword) {
            if (value !== emailFormData.confirmPassword) {
                setErrors({ ...errors, confirmPassword: "两次输入的密码不一致" });
            } else {
                setErrors({ ...errors, confirmPassword: "" });
            }
        }

        // 如果修改了确认密码，检查与密码是否一致
        if (name === "confirmPassword") {
            if (value !== emailFormData.password) {
                setErrors({ ...errors, confirmPassword: "两次输入的密码不一致" });
            } else {
                setErrors({ ...errors, confirmPassword: "" });
            }
        }
    };

    // 验证手机号注册表单
    const validatePhoneForm = () => {
        const newErrors = {};

        // 验证用户名
        if (!phoneFormData.username) {
            newErrors.username = "请输入用户名";
        } else if (phoneFormData.username.length < 3) {
            newErrors.username = "用户名长度不能少于3个字符";
        } else if (phoneFormData.username.length > 20) {
            newErrors.username = "用户名长度不能超过20个字符";
        }

        // 验证密码
        if (!phoneFormData.password) {
            newErrors.password = "请输入密码";
        } else if (phoneFormData.password.length < 8) {
            newErrors.password = "密码长度不能少于8个字符";
        } else if (!/\d/.test(phoneFormData.password)) {
            newErrors.password = "密码必须包含至少一个数字";
        } else if (!/[a-zA-Z]/.test(phoneFormData.password)) {
            newErrors.password = "密码必须包含至少一个字母";
        }

        // 验证确认密码
        if (!phoneFormData.confirmPassword) {
            newErrors.confirmPassword = "请再次输入密码";
        } else if (phoneFormData.password !== phoneFormData.confirmPassword) {
            newErrors.confirmPassword = "两次输入的密码不一致";
        }

        // 验证手机号
        if (!phoneFormData.phone) {
            newErrors.phone = "请输入手机号";
        } else if (!/^1[3-9]\d{9}$/.test(phoneFormData.phone)) {
            newErrors.phone = "请输入有效的手机号";
        }

        // 验证验证码
        if (!phoneFormData.verificationCode) {
            newErrors.verificationCode = "请输入验证码";
        } else if (phoneFormData.verificationCode.length !== 6) {
            newErrors.verificationCode = "验证码必须是6位数字";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 验证邮箱注册表单
    const validateEmailForm = () => {
        const newErrors = {};

        // 验证用户名
        if (!emailFormData.username) {
            newErrors.username = "请输入用户名";
        } else if (emailFormData.username.length < 3) {
            newErrors.username = "用户名长度不能少于3个字符";
        } else if (emailFormData.username.length > 20) {
            newErrors.username = "用户名长度不能超过20个字符";
        }

        // 验证密码
        if (!emailFormData.password) {
            newErrors.password = "请输入密码";
        } else if (emailFormData.password.length < 8) {
            newErrors.password = "密码长度不能少于8个字符";
        } else if (!/\d/.test(emailFormData.password)) {
            newErrors.password = "密码必须包含至少一个数字";
        } else if (!/[a-zA-Z]/.test(emailFormData.password)) {
            newErrors.password = "密码必须包含至少一个字母";
        }

        // 验证确认密码
        if (!emailFormData.confirmPassword) {
            newErrors.confirmPassword = "请再次输入密码";
        } else if (emailFormData.password !== emailFormData.confirmPassword) {
            newErrors.confirmPassword = "两次输入的密码不一致";
        }

        // 验证邮箱
        if (!emailFormData.email) {
            newErrors.email = "请输入邮箱地址";
        } else if (!emailService.validateEmail(emailFormData.email)) {
            newErrors.email = "请输入有效的邮箱地址";
        }

        // 验证验证码
        if (!emailFormData.verificationCode) {
            newErrors.verificationCode = "请输入验证码";
        } else if (emailFormData.verificationCode.length !== 6) {
            newErrors.verificationCode = "验证码必须是6位数字";
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
            setIsSendingPhoneCode(true);

            // 使用smsService发送验证码，指定注册场景
            const response = await smsService.sendVerificationCode(phoneFormData.phone, 'register');

            // 成功情况 - 响应码200
            if (response.data.code === 200) {
                // 显示成功信息
                notification.success(response.data.message || "验证码发送成功");

                // 开始倒计时
                setPhoneCountdown(60);
            } else {
                setErrors({
                    ...errors,
                    phone: response.data.message || "验证码发送可能失败，请稍后再试"
                });
                notification.warning(response.data.message || "验证码发送可能失败，请稍后再试");
            }
        } catch (error) {
            console.error("发送验证码失败:", error);

            if (error.response) {
                const responseData = error.response.data;
                if (responseData && responseData.message) {
                    setErrors({ ...errors, phone: responseData.message });
                    notification.error(responseData.message);
                } else {
                    setErrors({ ...errors, phone: "验证码发送失败，请稍后再试" });
                    notification.error("验证码发送失败，请稍后再试");
                }
            } else {
                setErrors({ ...errors, phone: "网络错误，请检查您的网络连接" });
                notification.error("网络错误，请检查您的网络连接");
            }
        } finally {
            setIsSendingPhoneCode(false);
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
            setIsSendingEmailCode(true);

            // 使用emailService发送验证码，指定注册场景
            const response = await emailService.sendVerificationCode(emailFormData.email, 'register');

            // 成功情况 - 响应码200
            if (response.data.code === 200) {
                // 显示成功信息
                notification.success(response.data.message || "验证码发送成功，请查收邮箱");

                // 开始倒计时
                setEmailCountdown(60);
            } else {
                setErrors({
                    ...errors,
                    email: response.data.message || "验证码发送可能失败，请稍后再试"
                });
                notification.warning(response.data.message || "验证码发送可能失败，请稍后再试");
            }
        } catch (error) {
            console.error("发送邮箱验证码失败:", error);

            if (error.response) {
                const responseData = error.response.data;
                if (responseData && responseData.message) {
                    setErrors({ ...errors, email: responseData.message });
                    notification.error(responseData.message);
                } else {
                    setErrors({ ...errors, email: "验证码发送失败，请稍后再试" });
                    notification.error("验证码发送失败，请稍后再试");
                }
            } else {
                setErrors({ ...errors, email: "网络错误，请检查您的网络连接" });
                notification.error("网络错误，请检查您的网络连接");
            }
        } finally {
            setIsSendingEmailCode(false);
        }
    };

    // 处理手机号注册提交
    const handlePhoneSubmit = async (e) => {
        e.preventDefault();

        if (!validatePhoneForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await smsAuth.registerWithCode({
                username: phoneFormData.username,
                phone_number: phoneFormData.phone,
                password: phoneFormData.password,
                code: phoneFormData.verificationCode,
            });

            if (response.data.code === 200 || response.data.code === 201) {
                notification.success("注册成功！请登录您的账户");
                navigate("/login");
            } else {
                setErrors({ general: response.data.message || "注册失败，请重试" });
            }
        } catch (error) {
            console.error("注册失败:", error);

            if (error.response) {
                const responseData = error.response.data;

                if (responseData.errors && typeof responseData.errors === 'object') {
                    // 处理字段级别的错误
                    const fieldErrors = {};
                    Object.keys(responseData.errors).forEach(key => {
                        if (Array.isArray(responseData.errors[key])) {
                            fieldErrors[key] = responseData.errors[key][0];
                        } else {
                            fieldErrors[key] = responseData.errors[key];
                        }
                    });
                    setErrors(fieldErrors);
                } else if (responseData.message) {
                    setErrors({ general: responseData.message });
                } else {
                    setErrors({ general: "注册失败，请重试" });
                }

                notification.error(responseData.message || "注册失败，请重试");
            } else {
                setErrors({ general: "网络错误，请稍后重试" });
                notification.error("网络错误，请稍后重试");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 处理邮箱注册提交
    const handleEmailSubmit = async (e) => {
        e.preventDefault();

        if (!validateEmailForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await emailAuth.registerWithEmailCode({
                username: emailFormData.username,
                email: emailFormData.email,
                password: emailFormData.password,
                code: emailFormData.verificationCode,
            });

            if (response.data.code === 200 || response.data.code === 201) {
                notification.success("注册成功！请登录您的账户");
                navigate("/login");
            } else {
                setErrors({ general: response.data.message || "注册失败，请重试" });
            }
        } catch (error) {
            console.error("邮箱注册失败:", error);

            if (error.response) {
                const responseData = error.response.data;

                if (responseData.errors && typeof responseData.errors === 'object') {
                    // 处理字段级别的错误
                    const fieldErrors = {};
                    Object.keys(responseData.errors).forEach(key => {
                        if (Array.isArray(responseData.errors[key])) {
                            fieldErrors[key] = responseData.errors[key][0];
                        } else {
                            fieldErrors[key] = responseData.errors[key];
                        }
                    });
                    setErrors(fieldErrors);
                } else if (responseData.message) {
                    setErrors({ general: responseData.message });
                } else {
                    setErrors({ general: "注册失败，请重试" });
                }

                notification.error(responseData.message || "注册失败，请重试");
            } else {
                setErrors({ general: "网络错误，请稍后重试" });
                notification.error("网络错误，请稍后重试");
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
                <CardTitle className="text-2xl font-bold text-center card-title">创建账户</CardTitle>
                <CardDescription className="text-center">
                    注册一个账户，开始您的梦想之旅
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={registerMode} onValueChange={setRegisterMode} className="w-full">
                    <TabsList className={`grid w-full tabs-list ${availableRegisterMethods.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                        }`}>
                        {isFeatureEnabled('SMS_SERVICE_ENABLED') && (
                            <TabsTrigger value="phone" className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                手机注册
                            </TabsTrigger>
                        )}
                        {isFeatureEnabled('EMAIL_SERVICE_ENABLED') && (
                            <TabsTrigger value="email" className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                邮箱注册
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* 手机号注册 */}
                    {isFeatureEnabled('SMS_SERVICE_ENABLED') && (
                        <TabsContent value="phone" className="space-y-4">
                            <form onSubmit={handlePhoneSubmit} className="space-y-4">
                                <div className="form-field">
                                    <Label htmlFor="phone-username" className="form-label">用户名</Label>
                                    <div className="input-container">
                                        <User className="input-icon" />
                                        <Input
                                            id="phone-username"
                                            name="username"
                                            type="text"
                                            placeholder="请输入用户名"
                                            value={phoneFormData.username}
                                            onChange={handlePhoneFormChange}
                                            className={`pl-10 ${errors.username ? 'input-error' : ''}`}
                                        />
                                    </div>
                                    {errors.username && (
                                        <p className="error-message">{errors.username}</p>
                                    )}
                                </div>

                                <div className="form-field">
                                    <Label htmlFor="phone-password" className="form-label">密码</Label>
                                    <div className="input-container">
                                        <Lock className="input-icon" />
                                        <Input
                                            id="phone-password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="请输入密码"
                                            value={phoneFormData.password}
                                            onChange={handlePhoneFormChange}
                                            className={`pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                                        />
                                        <Button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        密码需包含至少8个字符，包括字母、数字
                                    </p>
                                    {errors.password && (
                                        <p className="error-message">{errors.password}</p>
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
                                            placeholder="请再次输入密码"
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
                                            disabled={phoneCountdown > 0 || isSendingPhoneCode}
                                            className={`verification-button ${isSendingPhoneCode ? 'is-loading' : ''}`}
                                        >
                                            {phoneCountdown > 0 ? `${phoneCountdown}s` : "获取验证码"}
                                        </Button>
                                    </div>
                                    {errors.verificationCode && (
                                        <p className="error-message">{errors.verificationCode}</p>
                                    )}
                                </div>

                                {errors.general && (
                                    <div className="error-message text-center">
                                        {errors.general}
                                    </div>
                                )}

                                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                                    {isLoading ? "注册中..." : "注册"}
                                </Button>
                            </form>
                        </TabsContent>
                    )}

                    {/* 邮箱注册 */}
                    {isFeatureEnabled('EMAIL_SERVICE_ENABLED') && (
                        <TabsContent value="email" className="space-y-4">
                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                <div className="form-field">
                                    <Label htmlFor="email-username" className="form-label">用户名</Label>
                                    <div className="input-container">
                                        <User className="input-icon" />
                                        <Input
                                            id="email-username"
                                            name="username"
                                            type="text"
                                            placeholder="请输入用户名"
                                            value={emailFormData.username}
                                            onChange={handleEmailFormChange}
                                            className={`pl-10 ${errors.username ? 'input-error' : ''}`}
                                        />
                                    </div>
                                    {errors.username && (
                                        <p className="error-message">{errors.username}</p>
                                    )}
                                </div>

                                <div className="form-field">
                                    <Label htmlFor="email-password" className="form-label">密码</Label>
                                    <div className="input-container">
                                        <Lock className="input-icon" />
                                        <Input
                                            id="email-password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="请输入密码"
                                            value={emailFormData.password}
                                            onChange={handleEmailFormChange}
                                            className={`pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                                        />
                                        <Button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        密码需包含至少8个字符，包括字母、数字
                                    </p>
                                    {errors.password && (
                                        <p className="error-message">{errors.password}</p>
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
                                            placeholder="请再次输入密码"
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
                                            disabled={emailCountdown > 0 || isSendingEmailCode}
                                            className={`verification-button ${isSendingEmailCode ? 'is-loading' : ''}`}
                                        >
                                            {emailCountdown > 0 ? `${emailCountdown}s` : "获取验证码"}
                                        </Button>
                                    </div>
                                    {errors.verificationCode && (
                                        <p className="error-message">{errors.verificationCode}</p>
                                    )}
                                </div>

                                {errors.general && (
                                    <div className="error-message text-center">
                                        {errors.general}
                                    </div>
                                )}

                                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                                    {isLoading ? "注册中..." : "注册"}
                                </Button>
                            </form>
                        </TabsContent>
                    )}
                </Tabs>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-center login-link">
                    已有账户？{" "}
                    <button onClick={handleGoToLogin} className="text-primary hover:underline">
                        立即登录
                    </button>
                </div>
            </CardFooter>
        </Card>
    );
} 