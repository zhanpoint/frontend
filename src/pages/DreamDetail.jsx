import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDreams } from "@/hooks/useDreams";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from 'react-markdown';
import tokenManager from "@/services/auth/tokenManager";
import {
    Moon,
    Calendar,
    Clock,
    MapPin,
    Users,
    ArrowLeft,
    Bookmark,
    Star,
    Share2,
    HelpCircle,
    AlertCircle,
    Palette
} from "lucide-react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button.jsx";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.jsx";
import notification from "@/utils/notification";
import DreamImageWebSocketClient from '@/services/webSocket/DreamImageWebSocketClient.js';
import "./css/DreamDetail.css";

// 常量配置对象
const CONFIG = {
    categories: {
        normal: "bg-gray-500", memorable: "bg-blue-500", indicate: "bg-cyan-500",
        archetypal: "bg-purple-500", lucid: "bg-green-500", nightmare: "bg-red-500",
        repeating: "bg-yellow-500", sleep_paralysis: "bg-indigo-500"
    },
    tags: {
        theme: { icon: <Palette className="h-3 w-3" />, class: "dream-tag-theme" },
        character: { icon: <Users className="h-3 w-3" />, class: "dream-tag-character" },
        location: { icon: <MapPin className="h-3 w-3" />, class: "dream-tag-location" }
    },
    tooltips: [
        { tip: '收藏梦境', icon: <Star /> },
        { tip: '添加书签', icon: <Bookmark /> },
        { tip: '分享梦境', icon: <Share2 /> }
    ]
};

// 格式化工具函数
const formatUtils = {
    date: dateString => {
        if (!dateString) return "未知日期";
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    time: dateString => {
        if (!dateString) return "未知时间";
        const date = new Date(dateString);
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
};

// Markdown渲染组件
const MarkdownRenderer = ({ content }) => {
    const markdownComponents = {
        img: ({ node, ...props }) => {
            const isValidUrl = props.src && (props.src.startsWith('http') || props.src.startsWith('data:'));

            if (!isValidUrl) {
                return (
                    <div className="flex items-center justify-center bg-red-900/20 border border-red-800/50 rounded-md p-4 my-4">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-sm text-red-300">图片加载失败</span>
                    </div>
                );
            }

            return (
                <div className="relative rounded-md overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-purple-900/30">
                    <img
                        {...props}
                        className="rounded-md max-w-full transition-all duration-300 hover:scale-[1.01]"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                            e.target.alt = '图片加载失败';
                            e.target.className = 'hidden';
                            e.target.parentNode.classList.add('img-error');
                        }}
                        loading="lazy"
                        alt={props.alt || "梦境图片"}
                    />
                </div>
            );
        },
        h1: ({ ...props }) => <h1 className="text-2xl font-bold text-purple-100 my-4" {...props} />,
        h2: ({ ...props }) => <h2 className="text-xl font-bold text-purple-200 my-3" {...props} />,
        h3: ({ ...props }) => <h3 className="text-lg font-bold text-purple-300 my-2" {...props} />,
        h4: ({ ...props }) => <h4 className="text-base font-bold text-purple-400 my-2" {...props} />,
        p: ({ ...props }) => <p className="my-2 text-gray-200" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc pl-6 my-4 space-y-1" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal pl-6 my-4 space-y-1" {...props} />,
        li: ({ ...props }) => <li className="text-gray-300" {...props} />,
        blockquote: ({ ...props }) => <blockquote className="border-l-4 border-purple-600 pl-4 italic text-gray-400 my-4" {...props} />,
        a: ({ ...props }) => <a className="text-blue-400 hover:text-blue-300 underline" {...props} />
    };

    return (
        <div className="dream-content text-gray-100 leading-relaxed prose prose-invert prose-sm max-w-none">
            <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
        </div>
    );
};

/**
 * 梦境详情页面组件
 */
const DreamDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { dreams, isLoading: dreamsLoading, getDreamById, fetchDreams, addOrUpdateDream } = useDreams();
    const [dream, setDream] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);
    const updateContentDebounceRef = useRef(null);

    // 处理图片更新并更新内容
    const processImagesUpdate = useCallback((images) => {
        if (!images?.length) return false;

        const dreamData = getDreamById(id) || dream;
        if (!dreamData) {
            fetchDreams().then(() => {
                const freshDream = getDreamById(id);
                if (freshDream) {
                    setDream(freshDream);
                    setTimeout(() => updateContent(freshDream), 100);
                } else {
                    notification.error('无法加载梦境数据');
                }
            });
            return false;
        }

        // 更新内容中的图片
        const updateContent = (dreamData) => {
            if (!dreamData) return false;
            try {
                const updatedDream = { ...dreamData };
                const sortedImages = [...images].sort((a, b) => a.position - b.position);
                let content = updatedDream.content || "";
                let offset = 0;

                for (const image of sortedImages) {
                    if (!image.url) continue;
                    const position = image.position + offset;
                    const imageMarkdown = `![梦境图片](${image.url})`;

                    if (position <= content.length) {
                        content = content.substring(0, position) + imageMarkdown + content.substring(position);
                        offset += imageMarkdown.length;
                    } else {
                        const newLinePrefix = !content.endsWith('\n\n') ? (content.endsWith('\n') ? '\n' : '\n\n') : '';
                        content += newLinePrefix + imageMarkdown;
                    }
                }

                updatedDream.content = content;
                setDream(updatedDream);
                addOrUpdateDream(updatedDream);
                notification.success('图片处理完成！已成功添加到您的梦境记录中');
                return true;
            } catch {
                notification.error('更新梦境内容失败');
                return false;
            }
        };

        return updateContent(dreamData);
    }, [dream, id, getDreamById, fetchDreams, addOrUpdateDream]);

    // WebSocket消息处理
    const handleImageUpdate = useCallback((data) => {
        if (data.dream_id !== parseInt(id)) return;

        const latestDream = getDreamById(id);
        if (latestDream && (!dream || dream.id !== latestDream.id)) {
            setDream(latestDream);
        }

        const statusHandlers = {
            processing: () => {
                if (!socketRef.current?.isProcessingNotified) {
                    notification.info(`图片处理中...`);
                    if (socketRef.current) socketRef.current.isProcessingNotified = true;
                }
            },
            completed: () => {
                if (socketRef.current) socketRef.current.isProcessingNotified = false;
                if (data.images?.length > 0) {
                    if (updateContentDebounceRef.current) clearTimeout(updateContentDebounceRef.current);
                    updateContentDebounceRef.current = setTimeout(() => processImagesUpdate(data.images), 500);
                } else {
                    notification.success('图片处理完成');
                }
            },
            failed: () => {
                if (socketRef.current) socketRef.current.isProcessingNotified = false;
                notification.error(data.message || '图片处理失败');
            },
            delete_processing: () => notification.info(data.message || `正在删除图片...`),
            delete_completed: () => notification.success(data.message || '图片已成功删除'),
            delete_failed: () => notification.error(data.message || '删除图片时出现错误')
        };

        const handler = statusHandlers[data.status];
        if (handler) handler();
    }, [id, getDreamById, dream, setDream, processImagesUpdate]);

    // 设置WebSocket连接
    const setupWebSocketConnection = useCallback(() => {
        if (!isAuthenticated || !id || socketRef.current) return;

        const token = tokenManager.getAccessToken();
        if (!token) return;

        socketRef.current = new DreamImageWebSocketClient(id, token, handleImageUpdate);
        socketRef.current.connect();
    }, [id, isAuthenticated, handleImageUpdate]);

    // 查找并设置梦境数据
    const findDream = useCallback(() => {
        const foundDream = getDreamById(id);
        if (foundDream) {
            setDream(foundDream);
            setError(null);
            setLoading(false);
            if (isAuthenticated) setupWebSocketConnection();
        } else {
            setError("找不到该梦境记录");
            setLoading(false);
        }
    }, [id, getDreamById, isAuthenticated, setupWebSocketConnection]);

    // 组合多个useEffect，统一处理组件生命周期
    useEffect(() => {
        if (authLoading) return;

        // 认证检查
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/dreams/${id}` } });
            return;
        }

        // 加载梦境数据
        if (dreams.length === 0 && !dreamsLoading) {
            fetchDreams().then(findDream);
        } else if (!dreamsLoading) {
            findDream();
        }

        // 检查图片处理状态
        if (dream && isAuthenticated && id) {
            const needsImageProcessing = dream.images_status?.status === 'processing' ||
                dream.content?.includes('![正在处理图片...]');
            if (needsImageProcessing) setupWebSocketConnection();
        }

        // 清理函数
        return () => {
            if (socketRef.current) {
                socketRef.current.unmount();
                socketRef.current = null;
            }
            if (updateContentDebounceRef.current) {
                clearTimeout(updateContentDebounceRef.current);
            }
        };
    }, [
        id, authLoading, isAuthenticated, dreams, dreamsLoading,
        navigate, fetchDreams, findDream, dream, setupWebSocketConnection
    ]);

    // 错误状态UI
    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
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
                    <AlertDescription>{error}</AlertDescription>
                </Alert>

                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Button
                        onClick={() => {
                            setError(null);
                            setLoading(true);
                            fetchDreams().then(findDream);
                        }}
                    >
                        重新获取数据
                    </Button>
                </div>
            </div>
        );
    }

    // 加载状态UI
    if (loading || authLoading || dreamsLoading || !dream) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
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
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-4 w-full mb-3" />
                        ))}
                        <Skeleton className="h-4 w-3/4 mb-6" />
                        <Skeleton className="h-56 w-full mb-8 rounded-lg" />

                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="mb-6">
                                <Skeleton className="h-5 w-32 mb-2" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-16" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 正常渲染UI
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
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
                            {CONFIG.tooltips.map(({ tip, icon }, i) => (
                                <TooltipProvider key={i}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-purple-400 hover:bg-gray-800/60">
                                                {icon}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{tip}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3 mt-3">
                        {/* 分类标签 */}
                        {dream.categories?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {dream.categories.map(category => (
                                    <Badge
                                        key={category.id || category.name}
                                        className={`${CONFIG.categories[category.name] || 'bg-gray-500'} text-xs px-2 py-1 category-badge`}
                                    >
                                        {category.display_name}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* 标签区域 */}
                        {dream.tags && Object.entries(dream.tags).some(([_, tags]) => tags?.length > 0) && (
                            <div className="flex flex-wrap gap-2 mt-1">
                                {Object.entries(dream.tags).map(([type, tags]) =>
                                    tags?.length > 0 && tags.map((tag, index) => (
                                        <Badge
                                            key={`${type}-${index}`}
                                            variant="outline"
                                            className={`tag-badge ${CONFIG.tags[type]?.class}`}
                                        >
                                            <span className="mr-1">{CONFIG.tags[type]?.icon}</span>
                                            <span>{tag}</span>
                                        </Badge>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 日期和时间 */}
                        <div className="flex items-center text-sm text-gray-400 mt-1 justify-between">
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{formatUtils.date(dream.created_at)}</span>
                            </div>
                            <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{formatUtils.time(dream.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-0">
                    {/* 梦境内容分割线 */}
                    <div className="border-t border-gray-800/70 my-3"></div>

                    {/* 梦境内容 */}
                    <div className="dream-content-container">
                        <div className="dream-body relative">
                            <MarkdownRenderer content={dream.content} />
                        </div>
                    </div>

                    {/* 解梦提示 */}
                    <div className="bg-purple-900/20 border border-purple-700/30 p-4 rounded-lg mt-6 dream-interpretation">
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
                    <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src="/assets/user-avatar.png" alt="用户头像" />
                            <AvatarFallback>用户</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium text-gray-300">我的梦境记录</p>
                            <p className="text-xs text-gray-500">私密记录 · 仅自己可见</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-gray-700 hover:bg-gray-800"
                        onClick={() => navigate(`/edit-dream/${dream.id}`)}
                    >
                        编辑梦境
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default DreamDetail; 