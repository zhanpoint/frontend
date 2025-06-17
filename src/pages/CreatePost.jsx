import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Loader2,
    HelpCircle,
    X,
    Users,
    MapPin,
    PenLine,
    FolderOpen,
    Bookmark,
    Palette,
} from "lucide-react";
import MDEditor from '@uiw/react-md-editor';
import "./css/CreatePost.css";
import notification from "@/utils/notification";
import api from "../services/api";
import { useDreams } from "@/contexts/DreamsContext";

import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card.jsx";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.jsx";

const MAX_CATEGORIES = 3;
const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 30;
const MIN_CONTENT_LENGTH = 30;
const MAX_CONTENT_LENGTH = 2000;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 3MB
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES = 3;

// 支持的图片格式
const SUPPORTED_FORMATS = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif']
};

// 梦境分类选项
const DREAM_CATEGORIES = [
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

// 获取内容中的所有图片URL
const extractImageUrls = (content) => {
    if (!content) return [];

    // 改进的正则表达式，更精确地匹配图片URL（包括blob和http）
    const regex = /!\[(.*?)\]\((blob:|https?:)[^)]+\)/g;
    const urls = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
        // 提取完整的URL（包括blob:前缀）
        const fullUrlMatch = /!\[(.*?)\]\(([^)]+)\)/.exec(match[0]);
        if (fullUrlMatch && fullUrlMatch[2]) {
            urls.push({
                alt: fullUrlMatch[1],
                url: fullUrlMatch[2]
            });
        }
    }

    console.log("正则提取的所有URLs:", urls.map(u => ({ alt: u.alt, url: u.url.substring(0, 30) + "..." })));
    return urls;
};

const CreatePost = ({ isEditMode = false, existingDream = null }) => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [cursorPosition, setCursorPosition] = useState(null);
    const [prevImageUrls, setPrevImageUrls] = useState([]);
    const { addOrUpdateDream } = useDreams();

    // 仅保留本地文件存储状态
    const [localFiles, setLocalFiles] = useState([]);

    // 状态初始化 - 编辑模式下填充已有数据
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({
        title: "",
        categories: "",
        content: "",
        images: ""
    });

    // 初始化表单数据（考虑编辑模式）
    const [formData, setFormData] = useState(() => {
        if (isEditMode && existingDream) {
            return {
                title: existingDream.title || "",
                content: existingDream.content || "",
                categories: existingDream.categories?.map(cat => cat.name) || ["normal"],
                theme: existingDream.tags?.theme || [],
                character: existingDream.tags?.character || [],
                location: existingDream.tags?.location || [],
            };
        }

        return {
            title: "",
            content: "",
            categories: ["normal"],
            theme: [],
            character: [],
            location: [],
        };
    });

    const [newTag, setNewTag] = useState({
        theme: "",
        character: "",
        location: "",
    });

    // 初始化图片信息（编辑模式）
    const [imageInfos, setImageInfos] = useState(() => {
        if (isEditMode && existingDream && existingDream.images) {
            return existingDream.images;
        }
        return [];
    });

    // 在编辑模式下初始化图片URL
    useEffect(() => {
        if (isEditMode && existingDream && existingDream.content) {
            const extractedUrls = extractImageUrls(existingDream.content);
            setPrevImageUrls(extractedUrls);
        }
    }, [isEditMode, existingDream]);

    // 验证图片格式
    const isValidImageFormat = (file) => Object.keys(SUPPORTED_FORMATS).includes(file.type);

    // 获取内容中的所有图片大小总和
    const getTotalImagesSize = () => {
        return localFiles.reduce((total, file) => total + file.size, 0);
    };

    // 在光标位置插入内容
    const insertAtCursor = (text, position) => {
        const currentContent = formData.content || "";
        const start = position?.start || position || 0;

        // 在光标位置插入文本
        const newContent = currentContent.substring(0, start) + text + currentContent.substring(start);

        // 更新内容
        setFormData(prev => ({
            ...prev,
            content: newContent
        }));
    };

    // 处理上传的图片并插入到内容中（仅本地预览）
    const processUploadedImage = useCallback((file) => {
        // 生成临时URL用于预览
        const imageUrl = URL.createObjectURL(file);

        // 生成图片ID
        const now = Date.now();
        const imageId = `img-${now}`;

        // 添加到本地文件列表
        setLocalFiles(prev => [...prev, {
            id: imageId,
            file: file,
            blobUrl: imageUrl,
            position: cursorPosition
        }]);

        // 构建Markdown格式的图片标记
        const imgMarkdown = `![${file.name || '图片'}](${imageUrl})`;

        // 将图片标记插入到内容中
        insertAtCursor(imgMarkdown, cursorPosition);

        // 清除错误提示
        if (errors.images) {
            setErrors(prev => ({ ...prev, images: "" }));
        }

        console.log("图片已添加到本地预览:", imageUrl, "ID:", imageId, "位置:", cursorPosition || "文末");
    }, [cursorPosition, errors, insertAtCursor]);

    // 从内容中移除所有图片Markdown
    const removeImagesFromContent = (content) => {
        // 匹配Markdown图片语法 ![alt](url)
        return content.replace(/!\[.*?\]\(.*?\)/g, '');
    };

    // 处理图片上传（仅本地预览）
    const handleImageUpload = (file, description = "") => {
        if (!file) {
            fileInputRef.current.click();
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setErrors({ ...errors, images: `图片大小不能超过${MAX_IMAGE_SIZE / 1024 / 1024}MB` });
            return;
        }

        if (!isValidImageFormat(file)) {
            setErrors({
                ...errors,
                images: `不支持的图片格式。支持的格式：${Object.values(SUPPORTED_FORMATS).flat().join(', ')}`
            });
            return;
        }

        // 检查图片总大小
        if (getTotalImagesSize() + file.size > MAX_TOTAL_SIZE) {
            setErrors({ ...errors, images: `所有图片总大小不能超过${MAX_TOTAL_SIZE / 1024 / 1024}MB` });
            return;
        }

        // 检查图片数量
        const imageMatches = formData.content?.match(/!\[.*?\]\(.*?\)/g) || [];
        if (imageMatches.length >= MAX_IMAGES) {
            setErrors({ ...errors, images: `最多只能插入${MAX_IMAGES}张图片` });
            return;
        }

        // 处理图片预览
        processUploadedImage(file);
    };

    // 检测内容变化清理不再使用的blob URL
    useEffect(() => {
        if (!formData.content) return;

        // 获取当前内容中的所有blob URL
        const blobUrlRegex = /!\[.*?\]\((blob:[^)]+)\)/g;
        const currentBlobUrls = [];
        let match;

        const contentCopy = formData.content;

        // 提取blob URLs (新上传的图片)
        while ((match = blobUrlRegex.exec(contentCopy)) !== null) {
            currentBlobUrls.push(match[1]);
        }

        // 释放不再使用的blob URL并更新本地文件列表
        setLocalFiles(prev => {
            const newLocalFiles = prev.filter(fileInfo => currentBlobUrls.includes(fileInfo.blobUrl));

            // 释放不再使用的blob URL
            prev.forEach(fileInfo => {
                if (!currentBlobUrls.includes(fileInfo.blobUrl)) {
                    URL.revokeObjectURL(fileInfo.blobUrl);
                }
            });

            return newLocalFiles;
        });
    }, [formData.content]);

    // 验证表单
    const validateForm = () => {
        const newErrors = {
            title: "",
            categories: "",
            content: "",
            images: ""
        };

        // 标题验证
        const titleLength = formData.title.trim().length;
        if (titleLength === 0) {
            newErrors.title = "标题不能为空";
        } else if (titleLength < MIN_TITLE_LENGTH) {
            newErrors.title = `标题至少需要${MIN_TITLE_LENGTH}个字符`;
        } else if (titleLength > MAX_TITLE_LENGTH) {
            newErrors.title = `标题不能超过${MAX_TITLE_LENGTH}个字符`;
        }

        // 分类验证
        if (formData.categories.length === 0) {
            newErrors.categories = "请至少选择一个梦境类型";
        } else if (formData.categories.length > MAX_CATEGORIES) {
            newErrors.categories = `最多只能选择${MAX_CATEGORIES}个类型`;
        }

        // 内容验证
        const contentLength = formData.content?.length || 0;
        if (contentLength < MIN_CONTENT_LENGTH) {
            newErrors.content = `内容至少需要${MIN_CONTENT_LENGTH}个字符`;
        } else if (contentLength > MAX_CONTENT_LENGTH) {
            newErrors.content = `内容不能超过${MAX_CONTENT_LENGTH}个字符`;
        }

        // 图片数量验证
        const imageMatches = formData.content?.match(/!\[.*?\]\(.*?\)/g) || [];
        if (imageMatches.length > MAX_IMAGES) {
            newErrors.images = `最多只能插入${MAX_IMAGES}张图片`;
        }

        setErrors(newErrors);
        return Object.values(newErrors).every(error => !error);
    };

    // 切换分类
    const toggleCategory = (value) => {
        setFormData(prev => {
            const isSelected = prev.categories.includes(value);
            const maxReached = prev.categories.length >= MAX_CATEGORIES && !isSelected;

            // 当用户尝试移除最后一个类型时进行验证
            if (isSelected && prev.categories.length === 1) {
                setErrors(prev => ({
                    ...prev,
                    categories: "请至少选择一个梦境类型"
                }));
                return prev; // 返回原状态，不允许移除
            }

            // 更新分类
            const newCategories = isSelected
                ? prev.categories.filter(cat => cat !== value)
                : maxReached ? prev.categories : [...prev.categories, value];

            // 更新错误提示
            setErrors(prev => ({
                ...prev,
                categories: maxReached ? `最多只能选择${MAX_CATEGORIES}个类型` : ""
            }));

            return { ...prev, categories: newCategories };
        });
    };

    // 标签管理
    const handleAddTag = (type) => {
        const value = newTag[type].trim();
        if (value && !formData[`${type}`].includes(value)) {
            setFormData(prev => ({
                ...prev,
                [`${type}`]: [...prev[`${type}`], value]
            }));
            setNewTag(prev => ({ ...prev, [type]: "" }));
        }
    };

    const handleRemoveTag = (type, tag) => {
        setFormData(prev => ({
            ...prev,
            [type]: [...prev[type]].filter(t => t !== tag)
        }));
    };

    const handleKeyPress = (e, type) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(type);
        }
    };

    // 取消编辑，释放所有blob URL并导航返回
    const handleCancel = useCallback(() => {
        // 释放所有blob URL
        localFiles.forEach(fileInfo => {
            URL.revokeObjectURL(fileInfo.blobUrl);
        });

        // 导航返回
        navigate(-1);
    }, [localFiles, navigate]);

    // 从内容中提取图片URL和位置信息
    const extractImagesInfo = useCallback(() => {
        if (!formData.content) return { remoteImages: [], localImages: [] };

        const remoteImages = [];
        const localImages = {};

        // 正则表达式匹配Markdown格式的图片
        const regex = /!\[(.*?)\]\((.*?)\)/g;
        let match;
        let index = 0;

        // 查找所有图片
        while ((match = regex.exec(formData.content)) !== null) {
            const url = match[2];
            const position = match.index;

            // 区分远程图片和本地图片
            if (url.startsWith('http')) {
                remoteImages.push({
                    url,
                    position,
                    description: match[1] || ''
                });
            } else if (url.startsWith('blob:')) {
                // 查找对应的本地文件
                const fileInfo = localFiles.find(f => f.blobUrl === url);
                if (fileInfo) {
                    localImages[url] = {
                        file: fileInfo.file,
                        position,
                        description: match[1] || ''
                    };
                }
            }
            index++;
        }

        return { remoteImages, localImages };
    }, [formData.content, localFiles]);

    // 表单提交处理函数
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 表单验证
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);

            // 提取图片信息
            const { remoteImages, localImages } = extractImagesInfo();

            // 准备提交数据
            const formDataObj = new FormData();
            let dreamId;

            // 基本信息
            formDataObj.append('title', formData.title);
            formDataObj.append('content', removeImagesFromContent(formData.content));

            // 分类
            formDataObj.append('categories', JSON.stringify(formData.categories));

            // 标签
            formDataObj.append('tags', JSON.stringify({
                theme: formData.theme,
                character: formData.character,
                location: formData.location
            }));

            // 处理远程图片信息
            if (remoteImages.length > 0) {
                formDataObj.append('remoteImages', JSON.stringify(
                    remoteImages.map(img => ({
                        url: img.url,
                        position: img.position,
                        description: img.description || ''
                    }))
                ));
            }

            // 处理本地上传的新图片
            Object.keys(localImages).forEach((blobUrl, index) => {
                const image = localImages[blobUrl];
                if (image.file) {
                    formDataObj.append(`imageFile_${index}`, image.file);

                    // 添加图片元数据
                    formDataObj.append(`imageMetadata_${index}`, JSON.stringify({
                        position: image.position,
                        description: image.description || ''
                    }));
                }
            });

            // 发送请求
            let response;
            if (isEditMode) {
                dreamId = existingDream.id;
                response = await api.put(`/dreams/${dreamId}/`, formDataObj, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                response = await api.post('/dreams/', formDataObj, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                dreamId = response.data.id;
            }

            // 处理响应
            const dreamData = response.data;

            // 检查是否有WebSocket通知信息
            if (dreamData.images_status && dreamData.images_status.status === 'processing') {
                // 显示提示信息
                notification.info(dreamData.images_status.message || '图片正在后台处理中...');
            }

            // 标准化梦境数据结构
            const normalizedDream = {
                id: dreamId,
                title: formData.title,
                content: formData.content,
                categories: formData.categories.map(cat => ({
                    value: cat,
                    display_name: DREAM_CATEGORIES.find(c => c.value === cat)?.label || cat
                })),
                tags: {
                    theme: formData.theme,
                    character: formData.character,
                    location: formData.location
                },
                images: dreamData.images || [], // 使用服务器返回的图片数据
                created_at: isEditMode ? existingDream.created_at : new Date().toISOString(),
                // 合并原始数据和新数据
                ...(isEditMode ? existingDream : {}),
                ...(typeof dreamData === 'object' ? dreamData : {}),
                // 保留WebSocket连接信息(如果有)
                ...(dreamData.images_status ? { images_status: dreamData.images_status } : {})
            };

            // 更新缓存
            console.log(isEditMode ? "更新成功，更新缓存:" : "创建成功，添加到缓存:", normalizedDream);
            addOrUpdateDream(normalizedDream);

            // 显示成功消息
            notification.success(isEditMode ? '你的梦境已成功更新！' : '你的梦境已成功创建！');

            // 释放所有blob URL
            localFiles.forEach(fileInfo => {
                URL.revokeObjectURL(fileInfo.blobUrl);
            });

            // 使用 setTimeout 给 toast 一点时间显示，然后再导航
            setTimeout(() => {
                // 导航到梦境详情页面
                navigate(`/dreams/${dreamId}`);
            }, 300);

        } catch (error) {
            console.error(isEditMode ? "更新梦境失败:" : "创建梦境失败:", error);

            // 输出更详细的错误信息
            if (error.response) {
                console.error("服务器响应:", {
                    状态: error.response.status,
                    响应数据: error.response.data,
                    响应头: error.response.headers
                });
            }

            notification.error(error.response?.data?.message || (isEditMode ? "更新梦境时发生错误，请稍后重试" : "创建梦境时发生错误，请稍后重试"));
        } finally {
            setIsSubmitting(false);
        }
    }

    // 自定义Markdown编辑器图片按钮
    useEffect(() => {
        const imageButton = document.querySelector('.w-md-editor-toolbar button[data-name="image"]');
        if (imageButton) {
            const newImageButton = imageButton.cloneNode(true);
            imageButton.parentNode.replaceChild(newImageButton, imageButton);

            newImageButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // 捕获光标位置
                const textarea = document.querySelector('.w-md-editor-text-input');
                if (textarea) {
                    setCursorPosition(textarea.selectionStart);
                    console.log("捕获光标位置:", textarea.selectionStart);
                }

                fileInputRef.current?.click();
            });
        }

        // 添加粘贴图片支持
        const editorTextArea = document.querySelector('.w-md-editor-text-input');
        if (editorTextArea) {
            const pasteHandler = (e) => {
                // 检查粘贴的内容是否包含图片
                const items = e.clipboardData?.items;
                if (!items) return;

                // 捕获当前光标位置
                setCursorPosition(editorTextArea.selectionStart);

                // 遍历粘贴的内容
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        // 阻止默认粘贴行为
                        e.preventDefault();

                        // 获取图片文件
                        const file = items[i].getAsFile();
                        if (file) {
                            console.log("粘贴图片:", file.name);

                            // 验证图片
                            if (!isValidImageFormat(file)) {
                                notification.error(`不支持的图片格式。支持的格式：${Object.values(SUPPORTED_FORMATS).flat().join(', ')}`);
                                return;
                            }

                            if (file.size > MAX_IMAGE_SIZE) {
                                notification.error(`图片大小不能超过${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
                                return;
                            }

                            // 处理上传
                            const totalSize = getTotalImagesSize() + file.size;
                            if (totalSize > MAX_TOTAL_SIZE) {
                                notification.error(`所有图片总大小不能超过${MAX_TOTAL_SIZE / 1024 / 1024}MB`);
                                return;
                            }

                            // 直接在前端预览，不发送请求
                            handleImageUpload(file);
                        }
                        break;
                    }
                }
            };

            editorTextArea.addEventListener('paste', pasteHandler);

            // 清理函数
            return () => {
                editorTextArea.removeEventListener('paste', pasteHandler);
            };
        }
    }, [formData.content, isValidImageFormat, getTotalImagesSize, SUPPORTED_FORMATS, MAX_IMAGE_SIZE, MAX_TOTAL_SIZE]);

    // 渲染UI组件
    const renderTagInput = (type, label, icon) => (
        <div className="form-item">
            <Label className="form-label">
                <div className="label-with-icon">
                    {icon}
                    <span>{label}</span>
                </div>
            </Label>
            <div className="tag-input-container">
                <Input
                    value={newTag[type]}
                    onChange={(e) => setNewTag(prev => ({ ...prev, [type]: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, type)}
                    placeholder={`添加${label}...`}
                    className="tag-input"
                />
                <Button
                    type="button"
                    onClick={() => handleAddTag(type)}
                    className={`tag-add-button custom-tag-${type}`}
                    variant="outline"
                >
                    添加
                </Button>
            </div>
            <div className="custom-tags">
                {formData[`${type}`].map((tag) => (
                    <Badge
                        key={tag}
                        variant="secondary"
                        className={`custom-tag custom-tag-${type}`}
                    >
                        {tag}
                        <span
                            className="tag-remove-icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTag(`${type}`, tag);
                            }}>
                            <X size={16} />
                        </span>
                    </Badge>
                ))}
            </div>
        </div>
    );

    return (
        <div className="create-post-container">
            <Card className="create-post-card">
                <CardHeader>
                    <CardTitle className="create-post-title">
                        <div className="label-with-icon title"
                            style={{ justifyContent: 'center', width: '100%', textAlign: 'center' }}>
                            <span>{isEditMode ? "编辑你的梦境记录" : "记录你的梦境，分享你的故事"}</span>
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
                                    setFormData(prev => ({ ...prev, title: e.target.value }));
                                    if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
                                }}
                                className={`form-input ${errors.title ? 'error' : ''}`}
                                required
                            />
                            {errors.title && <span className="error-message">{errors.title}</span>}
                        </div>

                        {/* 分类选择 */}
                        <div className="form-item">
                            <div className="category-header">
                                <Label className="form-label">
                                    <div className="label-with-icon">
                                        <FolderOpen className="label-icon" />
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
                                            {DREAM_CATEGORIES.map((category) => (
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
                                {DREAM_CATEGORIES.map((category) => (
                                    <Badge
                                        key={category.value}
                                        variant={formData.categories.includes(category.value) ? "default" : "outline"}
                                        className={`category-tag ${formData.categories.includes(category.value)
                                            ? category.color
                                            : "category-tag-outline"}`}
                                        onClick={() => toggleCategory(category.value)}
                                    >
                                        {category.label}
                                    </Badge>
                                ))}
                            </div>
                            {errors.categories && <span className="error-message">{errors.categories}</span>}
                        </div>

                        {/* 标签输入组 */}
                        {renderTagInput("theme", "主题标签", <Palette className="label-icon" />)}
                        {renderTagInput("character", "角色标签", <Users className="label-icon" />)}
                        {renderTagInput("location", "地点标签", <MapPin className="label-icon" />)}

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
                                onChange={(e) => handleImageUpload(e.target.files?.[0], e.target.files?.[0]?.name)}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            <div data-color-mode="dark">
                                <MDEditor
                                    value={formData.content}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, content: value || "" }));
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
                                        onSelect: (e) => {
                                            setCursorPosition(e.target.selectionStart);
                                            console.log("文本选择更新:", e.target.selectionStart);
                                        }
                                    }}
                                    visibleDragbar={false}
                                    hideToolbar={false}
                                    toolbarHeight={50}
                                    visibleProps={{
                                        fullscreen: false, // 隐藏全屏按钮
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
                            onClick={handleCancel}
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
                                    {isEditMode ? "保存中" : "提交中"}
                                </>
                            ) : (
                                isEditMode ? "保存更改" : "创建梦境"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default CreatePost; 