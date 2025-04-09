import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDreams } from "@/contexts/DreamsContext";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from 'react-markdown';
import tokenManager from "@/services/auth/tokenManager";
import {
    Moon,
    Calendar,
    Clock,
    Tag as TagIcon,
    MapPin,
    Users,
    Hash,
    ArrowLeft,
    Bookmark,
    Star,
    Share2,
    HelpCircle,
    AlertCircle,
    Palette,
    Image as ImageIcon,
    RefreshCw
} from "lucide-react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import notification from "@/utils/notification";
import ImageProcessingStatus from '@/components/dream/ImageProcessingStatus';
import DreamImageWebSocketClient from '@/services/webSocket/DreamImageWebSocketClient.js';
import { Spinner } from '@/components/ui/spinner';
import "./css/DreamDetail.css";

// 梦境分类颜色映射
const CATEGORY_COLORS = {
    normal: "bg-gray-500",
    memorable: "bg-blue-500",
    indicate: "bg-cyan-500",
    archetypal: "bg-purple-500",
    lucid: "bg-green-500",
    nightmare: "bg-red-500",
    repeating: "bg-yellow-500",
    sleep_paralysis: "bg-indigo-500"
};

// 标签类型图标映射
const TAG_ICONS = {
    theme: <Palette className="h-3 w-3" />,
    character: <Users className="h-3 w-3" />,
    location: <MapPin className="h-3 w-3" />
};

// 标签类型颜色映射
const TAG_COLORS = {
    theme: "dream-tag-theme",
    character: "dream-tag-character",
    location: "dream-tag-location"
};

/**
 * 梦境详情页面组件
 */
const DreamDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { dreams, isLoading: dreamsLoading, getDreamById, fetchDreams } = useDreams();
    const [dream, setDream] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // 图片处理状态
    const [processingImages, setProcessingImages] = useState(false);
    const [imageProgress, setImageProgress] = useState(0);
    const [imageStatus, setImageStatus] = useState('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [placeholderImages, setPlaceholderImages] = useState([]);

    // WebSocket引用
    const socketRef = useRef(null);
    // 防抖引用
    const updateContentDebounceRef = useRef(null);

    // 查找并设置梦境数据
    const findDream = useCallback(async () => {
        // 从已有数据中查找梦境
        const foundDream = getDreamById(id);
        console.log("DreamDetail: 尝试查找梦境", foundDream ? "成功" : "失败");

        if (foundDream) {
            setDream(foundDream);
            setError(null);
            setLoading(false);

            // 检查是否有图片正在处理
            if (foundDream.images_status && foundDream.images_status.status === 'processing') {
                setProcessingImages(true);
                setImageStatus('processing');
                setupWebSocketConnection();

                // 创建图片占位符
                if (foundDream.images_status.images && foundDream.images_status.images.length > 0) {
                    setPlaceholderImages(foundDream.images_status.images.map(img => ({
                        ...img,
                        isPlaceholder: true
                    })));
                }
            }
        } else {
            // 只设置UI错误消息，不使用notification显示
            setError("找不到该梦境记录");
            setLoading(false);
        }
    }, [id, getDreamById]);

    // 当组件挂载或ID更改时，从上下文中获取梦境
    useEffect(() => {
        console.log("DreamDetail: useEffect触发", {
            id,
            authLoading,
            isAuthenticated,
            dreamsCount: dreams.length,
            dreamsLoading
        });

        // 确保认证状态已加载
        if (!authLoading) {
            if (!isAuthenticated) {
                // 未登录，重定向到登录页
                navigate('/login', { state: { from: `/dreams/${id}` } });
                return;
            }

            // 梦境数据为空时尝试获取
            if (dreams.length === 0 && !dreamsLoading) {
                console.log("DreamDetail: 梦境列表为空，发起获取请求");
                fetchDreams().then(() => {
                    console.log("DreamDetail: 获取梦境数据完成，再次尝试查找");
                    findDream();
                });
            } else if (!dreamsLoading) {
                findDream();
            }
        }
    }, [id, authLoading, isAuthenticated, dreams, dreamsLoading, navigate, fetchDreams, findDream]);

    // 组件卸载时关闭WebSocket
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                console.log("组件卸载，关闭WebSocket连接");
                socketRef.current.unmount();
                socketRef.current = null;
            }
        };
    }, []);

    // 重试图片处理
    const retryImageProcessing = useCallback(() => {
        // 这里应该调用后端API来请求重新处理图片
        notification.info('正在请求重新处理图片...');
        // 假设这里会有一个API调用
        // TODO: 实现重试处理API

        // 重置处理状态
        setProcessingImages(true);
        setImageStatus('processing');
        setImageProgress(0);
        setStatusMessage('正在重新处理图片...');
    }, []);

    // 统一的梦境内容更新函数 - 处理图片插入逻辑
    const processImagesUpdate = useCallback((images) => {
        console.log("准备处理图片更新:", {
            imagesCount: images?.length,
            hasDream: !!dream,
            dreamId: id
        });

        // 如果没有图片数据，直接返回
        if (!images || images.length === 0) {
            console.warn("没有图片数据，无法更新内容");
            return;
        }

        // 获取最新的梦境数据
        const getDreamData = () => {
            // 首先检查当前状态
            let currentDream = dream;

            // 如果没有当前状态，从Context获取
            if (!currentDream) {
                currentDream = getDreamById(id);
                if (currentDream) {
                    console.log("从Context获取到梦境数据:", currentDream.id);
                    setDream(currentDream);
                }
            }

            return currentDream;
        };

        // 执行实际的内容更新
        const updateContent = (dreamData) => {
            if (!dreamData) {
                console.error("无法获取梦境数据");
                return false;
            }

            // 复制当前梦境数据
            const updatedDream = { ...dreamData };

            // 按位置排序图片
            const sortedImages = [...images].sort((a, b) => a.position - b.position);
            console.log("排序后的图片顺序:", sortedImages);

            // 计算并更新内容
            let content = updatedDream.content;
            let offset = 0;

            try {
                for (const image of sortedImages) {
                    if (!image.url) {
                        console.warn("图片URL为空，跳过插入:", image);
                        continue;
                    }

                    const position = image.position + offset;
                    // 添加替代文本和标题以提高图片的可访问性
                    const imageMarkdown = `![梦境图片](${image.url})`;

                    console.log(`插入图片到位置 ${position}: ${image.url}`);

                    if (position <= content.length) {
                        content = content.substring(0, position) + imageMarkdown + content.substring(position);
                        offset += imageMarkdown.length;
                    } else {
                        console.warn(`插入位置 ${position} 超出内容长度 ${content.length}, 附加到末尾`);
                        // 附加到内容末尾，添加换行确保格式正确
                        if (!content.endsWith('\n\n')) {
                            content += content.endsWith('\n') ? '\n' : '\n\n';
                        }
                        content += imageMarkdown;
                    }
                }

                updatedDream.content = content;
                console.log("更新后的梦境内容:", content.substring(0, 100) + (content.length > 100 ? '...' : ''));
                setDream(updatedDream);

                // 保存更新到本地存储以防页面刷新
                const localDreams = JSON.parse(localStorage.getItem('dreams') || '[]');
                const updatedLocalDreams = localDreams.map(d =>
                    d.id === updatedDream.id ? { ...d, content: updatedDream.content } : d
                );
                localStorage.setItem('dreams', JSON.stringify(updatedLocalDreams));

                notification.success('图片处理完成，已更新内容');
                return true;
            } catch (error) {
                console.error("更新梦境内容时出错:", error);
                notification.error('更新梦境内容失败');
                return false;
            }
        };

        // 首先尝试使用当前梦境数据
        let currentDream = getDreamData();
        if (currentDream) {
            return updateContent(currentDream);
        } else {
            // 如果获取不到，重新获取梦境数据
            console.log("尝试重新获取梦境数据...");
            fetchDreams().then(() => {
                const freshDream = getDreamById(id);
                if (freshDream) {
                    console.log("重新获取到梦境数据:", freshDream.id);
                    setDream(freshDream);
                    setTimeout(() => updateContent(freshDream), 100);
                } else {
                    notification.error('无法加载梦境数据，请刷新页面');
                }
            });
            return false;
        }
    }, [dream, id, getDreamById, fetchDreams, setDream]);

    // 设置WebSocket连接
    const setupWebSocketConnection = useCallback(() => {
        if (!isAuthenticated || !id) return;

        console.log("正在设置WebSocket连接", { dreamId: id });

        // 获取访问令牌
        const token = tokenManager.getAccessToken();

        if (!token) {
            notification.error('无法连接到图片处理服务：未授权');
            return;
        }

        // 确保我们有最新的梦境数据
        const currentDream = getDreamById(id);
        if (currentDream && !dream) {
            console.log("设置WebSocket前更新梦境数据:", currentDream.id);
            setDream(currentDream);
        }

        // 清理现有连接
        if (socketRef.current) {
            socketRef.current.unmount();
            socketRef.current = null;
        }

        // 图片更新处理函数
        const handleImageUpdate = (data) => {
            console.log("收到WebSocket图片更新消息:", data);

            // 确保只处理当前查看的梦境的消息
            if (data.dream_id !== parseInt(id)) {
                console.log(`收到的消息梦境ID(${data.dream_id})与当前查看的梦境ID(${id})不匹配，忽略此消息`);
                return;
            }

            // 确保我们始终有最新的梦境数据
            const latestDream = getDreamById(id);
            if (latestDream && (!dream || dream.id !== latestDream.id)) {
                console.log("更新梦境数据为最新状态:", latestDream.id);
                setDream(latestDream);
            }

            if (data.status === 'processing') {
                setProcessingImages(true);
                setImageStatus('processing');
                setImageProgress(data.progress || 0);
                setStatusMessage(data.message || '图片处理中...');

                // 如果有初始占位图片位置信息，创建占位标记
                if (data.images && data.images.length > 0) {
                    // 对图片位置进行排序
                    const sortedImages = [...data.images].sort((a, b) => a.position - b.position);

                    setPlaceholderImages(sortedImages.map(img => ({
                        ...img,
                        isPlaceholder: true
                    })));
                }
            } else if (data.status === 'completed') {
                // 图片处理完成后，更新状态
                setImageStatus('completed');
                setStatusMessage('图片处理已完成!');

                // 更新梦境内容，将图片插入到正确位置
                if (data.images && data.images.length > 0) {
                    console.log("准备更新梦境内容，添加图片:", data.images);

                    // 立即更新UI显示为已完成状态
                    setImageProgress(100);

                    // 使用防抖函数来确保状态稳定后再更新内容
                    // 这样可以避免可能的竞态条件
                    if (updateContentDebounceRef.current) {
                        clearTimeout(updateContentDebounceRef.current);
                    }

                    // 延迟略微长一点，确保梦境数据已加载
                    updateContentDebounceRef.current = setTimeout(() => {
                        const success = processImagesUpdate(data.images);

                        if (success) {
                            // 清除占位标记
                            setPlaceholderImages([]);

                            // 延迟后隐藏状态
                            setTimeout(() => {
                                setProcessingImages(false);
                            }, 3000);
                        }
                    }, 500);
                } else {
                    console.warn("收到completed状态但没有图片数据");
                    setProcessingImages(false);
                }
            } else if (data.status === 'failed') {
                setProcessingImages(true);
                setImageStatus('failed');
                setStatusMessage(data.message || '图片处理失败');

                // 清除占位标记
                setPlaceholderImages([]);

                notification.error('图片处理失败，请重试', {
                    action: {
                        label: '重试',
                        onClick: () => retryImageProcessing()
                    }
                });

                // 延迟后隐藏状态
                setTimeout(() => {
                    setProcessingImages(false);
                }, 5000);
            }
        };

        // 创建WebSocket客户端
        socketRef.current = new DreamImageWebSocketClient(
            id,
            token,
            handleImageUpdate
        );

        // 连接WebSocket
        console.log("开始连接WebSocket");
        socketRef.current.connect();
    }, [id, isAuthenticated, tokenManager.getAccessToken, getDreamById, dream, setDream, processImagesUpdate]);

    // 格式化日期
    const formatDate = (dateString) => {
        if (!dateString) return "未知日期";
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // 格式化时间
    const formatTime = (dateString) => {
        if (!dateString) return "未知时间";
        const date = new Date(dateString);
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 渲染占位图片
    const renderPlaceholderContent = (content) => {
        if (!content || placeholderImages.length === 0) return content;

        // 添加占位标记到内容中
        let modifiedContent = content;
        let offset = 0;

        const sortedPlaceholders = [...placeholderImages].sort((a, b) => a.position - b.position);

        try {
            for (const image of sortedPlaceholders) {
                const position = image.position + offset;
                const placeholderMarkdown = `![正在处理图片...](loading)`;

                if (position <= modifiedContent.length) {
                    modifiedContent = modifiedContent.substring(0, position) + placeholderMarkdown + modifiedContent.substring(position);
                    offset += placeholderMarkdown.length;
                } else {
                    // 如果位置超出内容长度，附加到末尾
                    if (!modifiedContent.endsWith('\n\n')) {
                        modifiedContent += modifiedContent.endsWith('\n') ? '\n' : '\n\n';
                    }
                    modifiedContent += placeholderMarkdown;
                }
            }
        } catch (error) {
            console.error("生成占位内容时出错:", error);
        }

        return modifiedContent;
    };

    // 自定义组件用于渲染Markdown内容
    const MarkdownWithPlaceholders = ({ content }) => {
        const processedContent = processingImages && placeholderImages.length > 0
            ? renderPlaceholderContent(content)
            : content;

        return (
            <div className="dream-content text-gray-100 leading-relaxed prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                    components={{
                        img: ({ node, ...props }) => {
                            // 处理占位图片
                            if (props.src === 'loading') {
                                return (
                                    <div className="image-placeholder flex items-center justify-center bg-gray-800/50 border border-gray-700 rounded-md p-4 my-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <Spinner size="lg" variant="primary" />
                                            <span className="text-sm text-gray-400">图片处理中...</span>
                                        </div>
                                    </div>
                                );
                            }

                            // 检查图片URL是否有效
                            const isValidUrl = props.src && (
                                props.src.startsWith('http://') ||
                                props.src.startsWith('https://') ||
                                props.src.startsWith('data:')
                            );

                            // 无效URL时显示错误提示
                            if (!isValidUrl) {
                                return (
                                    <div className="image-error flex items-center justify-center bg-red-900/30 border border-red-800 rounded-md p-4 my-4">
                                        <span className="text-sm text-red-300">图片加载失败</span>
                                    </div>
                                );
                            }

                            // 正常图片，添加错误处理和加载状态
                            return (
                                <div className="image-wrapper relative">
                                    <img
                                        {...props}
                                        className="rounded-md max-w-full"
                                        onError={(e) => {
                                            console.error("图片加载失败:", e.target.src);
                                            e.target.onerror = null;
                                            e.target.src = ''; // 清除src以防止循环请求
                                            e.target.alt = '图片加载失败';
                                            e.target.className = 'hidden';
                                            e.target.parentNode.classList.add('img-error');
                                        }}
                                        loading="lazy"
                                        alt={props.alt || "梦境图片"}
                                    />
                                </div>
                            );
                        }
                    }}
                >
                    {processedContent}
                </ReactMarkdown>
            </div>
        );
    };

    // 渲染图片处理状态
    const renderImageProcessingStatus = () => {
        if (processingImages) {
            return (
                <div className="image-processing-wrapper mb-4">
                    <ImageProcessingStatus
                        status={imageStatus}
                        progress={imageProgress}
                        message={statusMessage}
                    />
                </div>
            );
        }
        return null;
    };

    // 渲染梦境详细内容
    const renderDreamContent = () => {
        if (!dream) return null;

        return (
            <div className="dream-content-container">
                <div className="dream-body">
                    {/* 图片处理状态显示 */}
                    {renderImageProcessingStatus()}

                    {/* Markdown渲染器展示内容 */}
                    <MarkdownWithPlaceholders content={dream.content} />
                </div>
            </div>
        );
    };

    // 渲染错误状态
    if (error) {
        return (
            <div className="dream-detail-container max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Moon className="h-8 w-8 text-purple-400" />
                        <h1 className="text-2xl font-bold text-purple-50">梦境详情</h1>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center"
                        onClick={() => navigate('/my-dreams')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        返回列表
                    </Button>
                </div>

                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>获取梦境失败</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>

                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Button
                        onClick={() => {
                            // 设置加载状态并清除之前的错误
                            setError(null);
                            setLoading(true);
                            // 重新获取梦境数据
                            fetchDreams().then(() => {
                                findDream();
                            });
                        }}
                    >
                        重新获取数据
                    </Button>
                </div>
            </div>
        );
    }

    // 渲染加载状态
    if (loading || authLoading || dreamsLoading || !dream) {
        return (
            <div className="dream-detail-container max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-48" />
                </div>

                <Card className="dream-detail-card">
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4 mb-2" />
                        <div className="flex gap-2 mb-2">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                        <Skeleton className="h-4 w-40" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full mb-3" />
                        <Skeleton className="h-4 w-full mb-3" />
                        <Skeleton className="h-4 w-full mb-3" />
                        <Skeleton className="h-4 w-3/4 mb-6" />

                        <Skeleton className="h-56 w-full mb-8 rounded-lg" />

                        <div className="space-y-6">
                            <div>
                                <Skeleton className="h-5 w-32 mb-2" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-16" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            </div>

                            <div>
                                <Skeleton className="h-5 w-32 mb-2" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-16" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="dream-detail-container max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Moon className="h-8 w-8 text-purple-400" />
                    <h1 className="text-2xl font-bold text-purple-50">梦境详情</h1>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center hover:bg-gray-800/60"
                    onClick={() => navigate('/my-dreams')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    返回列表
                </Button>
            </div>

            <Card className="dream-detail-card mb-8">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-2xl font-bold text-purple-50 dream-title">{dream.title}</CardTitle>
                        <div className="flex space-x-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-yellow-400 hover:bg-gray-800/60">
                                            <Star className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>收藏梦境</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-purple-400 hover:bg-gray-800/60">
                                            <Bookmark className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>添加书签</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-400 hover:bg-gray-800/60">
                                            <Share2 className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>分享梦境</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    <div className="dream-metadata flex flex-col space-y-3 mt-3">
                        {/* 分类标签 */}
                        <div className="flex flex-wrap gap-2">
                            {dream.categories && dream.categories.map(category => (
                                <Badge
                                    key={category.id || category.name}
                                    className={`${CATEGORY_COLORS[category.name] || 'bg-gray-500'} text-xs px-2 py-1 category-badge`}
                                >
                                    {category.display_name}
                                </Badge>
                            ))}
                        </div>

                        {/* 标签区域 - 水平展示 */}
                        {dream.tags && Object.entries(dream.tags).some(([type, tags]) => tags && tags.length > 0) && (
                            <div className="tags-container flex flex-wrap gap-2 mt-1">
                                {Object.entries(dream.tags).map(([type, tags]) =>
                                    tags && tags.length > 0 ? (
                                        tags.map((tag, index) => (
                                            <Badge
                                                key={`${type}-${index}`}
                                                variant="outline"
                                                className={`tag-badge ${TAG_COLORS[type]}`}
                                            >
                                                <span className="tag-icon mr-1">{TAG_ICONS[type]}</span>
                                                <span>{tag}</span>
                                            </Badge>
                                        ))
                                    ) : null
                                )}
                            </div>
                        )}

                        {/* 日期和时间 */}
                        <div className="flex items-center text-sm text-gray-400 mt-1 justify-between">
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{formatDate(dream.created_at)}</span>
                            </div>
                            <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{formatTime(dream.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-0">
                    {/* 梦境内容分割线 */}
                    <div className="border-t border-gray-800/70 my-3"></div>

                    {/* 渲染梦境详细内容 */}
                    {renderDreamContent()}

                    {/* 解梦提示 */}
                    <div className="dream-interpretation bg-purple-900/20 border border-purple-700/30 p-4 rounded-lg mt-6">
                        <div className="flex items-center mb-2">
                            <HelpCircle className="h-5 w-5 text-purple-400 mr-2" />
                            <h3 className="text-md font-medium text-purple-300">解梦提示</h3>
                        </div>
                        <p className="text-sm text-gray-300">
                            这个梦境可能反映了你的潜意识中的情感和经历。关注梦中的象征物和情感，它们可能与你当前生活中的某些方面有关联。
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-between items-center pt-4 border-t border-gray-800">
                    <div className="dream-author flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src="/assets/user-avatar.png" alt="用户头像" />
                            <AvatarFallback>用户</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium text-gray-300">我的梦境记录</p>
                            <p className="text-xs text-gray-500">私密记录 · 仅自己可见</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {imageStatus === 'failed' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-gray-700 hover:bg-gray-800 flex items-center"
                                onClick={retryImageProcessing}
                            >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                重试图片处理
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-gray-700 hover:bg-gray-800"
                            onClick={() => navigate(`/edit-dream/${dream.id}`)}
                        >
                            编辑梦境
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default DreamDetail; 