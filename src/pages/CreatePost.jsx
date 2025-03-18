import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import {
    Loader2,
    HelpCircle,
    X,
    Users,
    MapPin,
    PenLine,
    Tags,
    Bookmark,
    Palette,
} from "lucide-react";
import MDEditor from '@uiw/react-md-editor';
import "./css/CreatePost.css";
import notification from "@/utils/notification";
import api from "../services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";


const MAX_CATEGORIES = 3;
const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 30;
const MIN_CONTENT_LENGTH = 30;
const MAX_CONTENT_LENGTH = 2000;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES = 3;

// 支持的图片格式
const SUPPORTED_FORMATS = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif']
};

const CreatePost = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({
        title: "",
        categories: "",
        content: "",
        images: ""
    });

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        categories: [],
        themes: [],
        characters: [],
        locations: [],
    });

    const [newTag, setNewTag] = useState({
        theme: "",
        character: "",
        location: "",
    });

    const fileInputRef = React.useRef(null);

    // 梦境分类选项
    const categories = [
        {
            value: "normal",
            label: "普通梦境",
            color: "bg-gray-500",
            description: "是日常梦，它们可能不会引发强烈情感或显得特别重要。然而，即使是看似平凡的梦，也可以在探索时提供有价值的见解，并反映您的潜意识思考和每日经验。"
        },
        {
            value: "memorable",
            label: "难忘梦境",
            color: "bg-blue-500",
            description: "在记忆中留下持久印象的梦。这类梦通常被终身铭记，具有深刻意义，可能导致重大的生活变化或深刻的个人洞察。"
        }, {
            value: "indicate",
            label: "预示梦境",
            color: "bg-cyan-500",
            description: "似乎预示了未来事件，无论是字面意义还是象征性的。这些梦可以提供关于即将到来的生活事件或健康问题的洞察，有时可以在做出重要决定时提供帮助。"
        },
        {
            value: "archetypal",
            label: "原型梦境",
            color: "bg-purple-500",
            description: "源自集体潜意识，反映人类普遍的经验。这些原型梦具有深刻的变革性，往往在精神或情感层面上引导人联系到更广泛的人类神话和故事。"
        },
        {
            value: "lucid",
            label: "清醒梦",
            color: "bg-green-500",
            description: "发生在意识到自己在梦中时，能对梦的环境有一定的控制，可用于治疗目的，如克服噩梦或探索创造力。"
        },
        {
            value: "nightmare",
            label: "噩梦",
            color: "bg-red-500",
            description: "伴随着常常引起强烈的恐惧、悲伤或其他抗拒情绪的梦。它们很常见，可能充其令人痛苦，有时反映出您清醒生活中的未解决问题或压力。"
        },
        {
            value: "repeating",
            label: "重复梦",
            color: "bg-yellow-500",
            description: "在一段时间内重复出现，尤其是在压力期。它们通常指向未解决的问题或持续的担忧。跟踪这些梦中的变化可以揭示您心理状态或生活状况的进展。"
        },
        {
            value: "sleep_paralysis",
            label: "睡眠瘫痪",
            color: "bg-indigo-500",
            description: "醒来时无法移动的状态，常伴随房间内的存在感或胸部有重物的感觉。这种现象可能令人恐惧，但通常是暂时的，并在缺乏睡眠和压力期间更为常见"
        },
    ];

    // 验证图片格式
    const isValidImageFormat = (file) => {
        return Object.keys(SUPPORTED_FORMATS).includes(file.type);
    };

    // 获取内容中的所有图片大小总和
    const getTotalImagesSize = (content) => {
        const imageUrls = (content?.match(/!\[.*?\]\((blob:.*?)\)/g) || [])
            .map(match => match.match(/\((blob:.*?)\)/)[1]);

        return imageUrls.reduce((total, url) => {
            const file = Array.from(fileInputRef.current.files)
                .find(f => url === URL.createObjectURL(f));
            return total + (file?.size || 0);
        }, 0);
    };

    // 处理图片上传
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // 验证图片格式
            if (!isValidImageFormat(file)) {
                throw new Error(`不支持的图片格式。支持的格式：${Object.values(SUPPORTED_FORMATS).flat().join(', ')}`);
            }

            // 验证单个图片大小
            if (file.size > MAX_IMAGE_SIZE) {
                throw new Error(`图片大小不能超过${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
            }

            // 验证总大小
            const totalSize = getTotalImagesSize(formData.content) + file.size;
            if (totalSize > MAX_TOTAL_SIZE) {
                throw new Error(`所有图片总大小不能超过${MAX_TOTAL_SIZE / 1024 / 1024}MB`);
            }

            // 上传图片到后端
            const formDataObj = new FormData();
            formDataObj.append('file', file);

            // 获取最新的访问令牌
            const accessToken = localStorage.getItem('accessToken');

            try {
                // 先尝试使用当前令牌
                const response = await api.post('/upload/', formDataObj, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                // 处理成功响应
                const imageUrl = response.data.url;
                const imageMarkdown = `![${file.name}](${imageUrl})`;
                const currentContent = formData.content || "";
                const newContent = currentContent + (currentContent ? "\n" : "") + imageMarkdown;

                setFormData(prev => ({
                    ...prev,
                    content: newContent
                }));

                // 清除错误提示
                if (errors.images) {
                    setErrors(prev => ({ ...prev, images: "" }));
                }

                console.log("图片上传成功:", imageUrl);
            } catch (uploadError) {
                console.error("图片上传失败:", uploadError);

                // 如果是401错误，尝试手动刷新令牌并重试
                if (uploadError.response?.status === 401) {
                    try {
                        console.log("尝试手动刷新令牌...");
                        const refreshToken = localStorage.getItem('refreshToken');
                        if (!refreshToken) throw new Error("无刷新令牌");

                        // 手动刷新令牌
                        const refreshResponse = await axios.post(
                            'http://localhost:8412/api/token/refresh/',
                            { refresh: refreshToken }
                        );

                        const newToken = refreshResponse.data.access;
                        localStorage.setItem('accessToken', newToken);
                        console.log("令牌刷新成功，重试上传...");

                        // 使用新令牌重试上传
                        const retryResponse = await axios.post(
                            'http://localhost:8412/api/upload/',
                            formDataObj,
                            {
                                headers: {
                                    'Content-Type': 'multipart/form-data',
                                    'Authorization': `Bearer ${newToken}`
                                }
                            }
                        );

                        // 处理成功响应
                        const imageUrl = retryResponse.data.url;
                        const imageMarkdown = `![${file.name}](${imageUrl})`;
                        const currentContent = formData.content || "";
                        const newContent = currentContent + (currentContent ? "\n" : "") + imageMarkdown;

                        setFormData(prev => ({
                            ...prev,
                            content: newContent
                        }));

                        if (errors.images) {
                            setErrors(prev => ({ ...prev, images: "" }));
                        }

                        console.log("重试上传成功:", imageUrl);
                    } catch (retryError) {
                        console.error("重试上传失败:", retryError);
                        setErrors(prev => ({
                            ...prev,
                            images: "上传失败：认证错误，请尝试重新登录"
                        }));
                        throw retryError; // 重新抛出错误
                    }
                } else {
                    // 不是401错误，直接抛出
                    setErrors(prev => ({
                        ...prev,
                        images: uploadError.response?.data?.message || uploadError.message
                    }));
                    throw uploadError;
                }
            }
        } catch (error) {
            console.error("处理图片时出错:", error);
            setErrors(prev => ({
                ...prev,
                images: error.response?.data?.message || error.message
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {
            title: "",
            categories: "",
            content: "",
            images: ""
        };

        // 验证标题长度
        const titleLength = formData.title.trim().length;
        if (titleLength === 0) {
            newErrors.title = "标题不能为空";
        } else if (titleLength < MIN_TITLE_LENGTH) {
            newErrors.title = `标题至少需要${MIN_TITLE_LENGTH}个字符`;
        } else if (titleLength > MAX_TITLE_LENGTH) {
            newErrors.title = `标题不能超过${MAX_TITLE_LENGTH}个字符`;
        }

        // 验证分类数量
        if (formData.categories.length === 0) {
            newErrors.categories = "请至少选择一个梦境分类";
        } else if (formData.categories.length > MAX_CATEGORIES) {
            newErrors.categories = `最多只能选择${MAX_CATEGORIES}个分类`;
        }

        // 验证内容长度
        const contentLength = formData.content?.length || 0;
        if (contentLength < MIN_CONTENT_LENGTH) {
            newErrors.content = `内容至少需要${MIN_CONTENT_LENGTH}个字符`;
        } else if (contentLength > MAX_CONTENT_LENGTH) {
            newErrors.content = `内容不能超过${MAX_CONTENT_LENGTH}个字符`;
        }

        // 验证图片数量
        const imageMatches = formData.content?.match(/!\[.*?\]\(.*?\)/g) || [];
        if (imageMatches.length > MAX_IMAGES) {
            newErrors.images = `最多只能插入${MAX_IMAGES}张图片`;
        }

        setErrors(newErrors);
        return Object.values(newErrors).every(error => !error);
    };

    const toggleCategory = (value) => {
        setFormData(prev => {
            const newCategories = prev.categories.includes(value)
                ? prev.categories.filter(cat => cat !== value)
                : prev.categories.length >= MAX_CATEGORIES
                    ? prev.categories
                    : [...prev.categories, value];

            // 添加分类超限提示
            if (prev.categories.length >= MAX_CATEGORIES && !prev.categories.includes(value)) {
                setErrors(prev => ({
                    ...prev,
                    categories: `最多只能选择${MAX_CATEGORIES}个分类`
                }));
            } else {
                setErrors(prev => ({
                    ...prev,
                    categories: ""
                }));
            }

            return { ...prev, categories: newCategories };
        });
    };

    const handleAddTag = (type) => {
        const value = newTag[type].trim();
        if (value && !formData[`${type}s`].includes(value)) {
            setFormData(prev => ({
                ...prev,
                [`${type}s`]: [...prev[`${type}s`], value]
            }));
            setNewTag(prev => ({ ...prev, [type]: "" }));
        }
    };

    const handleRemoveTag = (type, tag) => {
        setFormData(prev => {
            const updatedTags = [...prev[type]].filter(t => t !== tag);
            return {
                ...prev,
                [type]: updatedTags
            };
        });
    };

    const handleKeyPress = (e, type) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(type);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // 构建请求数据
            const requestData = {
                title: formData.title.trim(),
                content: formData.content,
                categories: formData.categories,
                tags: {
                    themes: formData.themes,
                    characters: formData.characters,
                    locations: formData.locations
                }
            };

            // 发送创建梦境请求
            const response = await axios.post('/api/dreams', requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // 显示成功提示
            notification.success('你的梦境已成功创建！');

            // 跳转到梦境详情页
            navigate(`/dreams/${response.data.id}`);
        } catch (error) {
            console.error("创建梦境失败:", error);

            // 显示错误提示
            notification.error(error.response?.data?.message || "创建梦境时发生错误，请稍后重试");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 监听Markdown编辑器的图片图标点击事件
    React.useEffect(() => {
        const imageButton = document.querySelector('.w-md-editor-toolbar button[data-name="image"]');
        if (imageButton) {
            imageButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
            });
        }
    }, []);

    return (
        <div className="create-post-container">
            <Card className="create-post-card">
                <CardHeader>
                    <CardTitle className="create-post-title">
                        <div className="label-with-icon">
                            <PenLine className="card-icon" />
                            <span>记录你的梦境，分享你的故事</span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="create-post-content">
                        {/* 标题输入 */}
                        <div className="form-item">
                            <Label htmlFor="title" className="form-label">
                                <div className="label-with-icon">
                                    <Bookmark className="label-icon" />
                                    <span>标题</span>
                                </div>
                            </Label>
                            <Input
                                id="title"
                                placeholder={`标题 (${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH}个字符)`}
                                value={formData.title}
                                onChange={(e) => {
                                    setFormData({ ...formData, title: e.target.value });
                                    if (errors.title) {
                                        setErrors(prev => ({ ...prev, title: "" }));
                                    }
                                }}
                                className={`form-input ${errors.title ? 'error' : ''}`}
                                required
                            />
                            {errors.title && (
                                <span className="error-message">{errors.title}</span>
                            )}
                        </div>

                        {/* 分类选择 */}
                        <div className="form-item">
                            <div className="category-header">
                                <Label className="form-label">
                                    <div className="label-with-icon">
                                        <Tags className="label-icon" />
                                        <span>梦境分类</span>
                                    </div>
                                </Label>
                                <HoverCard>
                                    <HoverCardTrigger>
                                        <HelpCircle className="help-icon" />
                                    </HoverCardTrigger>
                                    <HoverCardContent className="hover-card-content">
                                        <h3 className="hover-card-title">梦境类型说明</h3>
                                        <div className="hover-card-grid">
                                            {categories.map((category) => (
                                                <div key={category.value} className="category-item">
                                                    <Badge className={`category-badge ${category.color}`}>
                                                        {category.label}
                                                    </Badge>
                                                    <p className="category-description">{category.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </HoverCardContent>
                                </HoverCard>
                            </div>
                            <div className="category-tags">
                                {categories.map((category) => (
                                    <Badge
                                        key={category.value}
                                        variant={formData.categories.includes(category.value) ? "default" : "outline"}
                                        className={`category-tag ${formData.categories.includes(category.value)
                                            ? category.color
                                            : "category-tag-outline"
                                            }`}
                                        onClick={() => toggleCategory(category.value)}
                                    >
                                        {category.label}
                                    </Badge>
                                ))}
                            </div>
                            {errors.categories && (
                                <span className="error-message">{errors.categories}</span>
                            )}
                        </div>

                        {/* 主题标签 */}
                        <div className="form-item">
                            <Label className="form-label">
                                <div className="label-with-icon">
                                    <Palette className="label-icon" />
                                    <span>主题标签</span>
                                </div>
                            </Label>
                            <div className="tag-input-container">
                                <Input
                                    value={newTag.theme}
                                    onChange={(e) => setNewTag(prev => ({ ...prev, theme: e.target.value }))}
                                    onKeyPress={(e) => handleKeyPress(e, 'theme')}
                                    placeholder="添加主题标签..."
                                    className="tag-input"
                                />
                                <Button
                                    type="button"
                                    onClick={() => handleAddTag('theme')}
                                    className="tag-add-button custom-tag-theme"
                                    variant="outline"
                                >
                                    添加
                                </Button>
                            </div>
                            <div className="custom-tags">
                                {formData.themes.map((theme) => (
                                    <Badge
                                        key={theme}
                                        variant="secondary"
                                        className="custom-tag custom-tag-theme"
                                    >
                                        {theme}
                                        <span
                                            className="tag-remove-icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveTag('themes', theme);
                                            }}>
                                            <X size={16} />
                                        </span>
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* 角色标签 */}
                        <div className="form-item">
                            <Label className="form-label">
                                <div className="label-with-icon">
                                    <Users className="label-icon" />
                                    <span>角色标签</span>
                                </div>
                            </Label>
                            <div className="tag-input-container">
                                <Input
                                    value={newTag.character}
                                    onChange={(e) => setNewTag(prev => ({ ...prev, character: e.target.value }))}
                                    onKeyPress={(e) => handleKeyPress(e, 'character')}
                                    placeholder="添加角色标签..."
                                    className="tag-input"
                                />
                                <Button
                                    type="button"
                                    onClick={() => handleAddTag('character')}
                                    className="tag-add-button custom-tag-character"
                                    variant="outline"
                                >
                                    添加
                                </Button>
                            </div>
                            <div className="custom-tags">
                                {formData.characters.map((character) => (
                                    <Badge
                                        key={character}
                                        variant="secondary"
                                        className="custom-tag custom-tag-character"
                                    >
                                        {character}
                                        <span
                                            className="tag-remove-icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveTag('characters', character);
                                            }}>
                                            <X size={16} />
                                        </span>
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* 地点标签 */}
                        <div className="form-item">
                            <Label className="form-label">
                                <div className="label-with-icon">
                                    <MapPin className="label-icon" />
                                    <span>地点标签</span>
                                </div>
                            </Label>
                            <div className="tag-input-container">
                                <Input
                                    value={newTag.location}
                                    onChange={(e) => setNewTag(prev => ({ ...prev, location: e.target.value }))}
                                    onKeyPress={(e) => handleKeyPress(e, 'location')}
                                    placeholder="添加地点标签..."
                                    className="tag-input"
                                />
                                <Button
                                    type="button"
                                    onClick={() => handleAddTag('location')}
                                    className="tag-add-button custom-tag-location"
                                    variant="outline"
                                >
                                    添加
                                </Button>
                            </div>
                            <div className="custom-tags">
                                {formData.locations.map((location) => (
                                    <Badge
                                        key={location}
                                        variant="secondary"
                                        className="custom-tag custom-tag-location"
                                    >
                                        {location}
                                        <span
                                            className="tag-remove-icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveTag('locations', location);
                                            }}>
                                            <X size={16} />
                                        </span>
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Markdown编辑器 */}
                        <div className="form-item">
                            <Label htmlFor="content" className="form-label">
                                <div className="label-with-icon">
                                    <PenLine className="label-icon" />
                                    <span>梦境内容</span>
                                </div>
                            </Label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            <div data-color-mode="light">
                                <MDEditor
                                    value={formData.content}
                                    onChange={(value) => {
                                        setFormData({ ...formData, content: value || "" });
                                        if (errors.content || errors.images) {
                                            setErrors(prev => ({
                                                ...prev,
                                                content: "",
                                                images: ""
                                            }));
                                        }
                                    }}
                                    preview="edit"
                                    height={400}
                                    className={`markdown-editor-container ${errors.content || errors.images ? 'error' : ''}`}
                                    textareaProps={{
                                        placeholder: `描述你的梦境...\n最少${MIN_CONTENT_LENGTH}个字符，最多${MAX_CONTENT_LENGTH}个字符\n最多${MAX_IMAGES}张图片，每张图片最大2MB`,
                                    }}
                                />
                            </div>
                            {(errors.content || errors.images) && (
                                <span className="error-message">
                                    {errors.content || errors.images}
                                </span>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="form-footer">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                            className="cancel-button"
                        >
                            取消
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || formData.categories.length === 0}
                            className="submit-button"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="loading-icon" />
                                    提交中
                                </>
                            ) : (
                                "创建梦境"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default CreatePost; 