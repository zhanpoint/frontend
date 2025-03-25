import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDreams } from "@/contexts/DreamsContext";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from 'react-markdown';
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
    Palette
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

            const findDream = () => {
                // 从已有数据中查找梦境
                const foundDream = getDreamById(id);
                console.log("DreamDetail: 尝试查找梦境", foundDream ? "成功" : "失败");

                if (foundDream) {
                    setDream(foundDream);
                    setError(null);
                } else {
                    // 只设置UI错误消息，不使用notification显示
                    setError("找不到该梦境记录");
                }
            };

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
    }, [id, authLoading, isAuthenticated, dreams, dreamsLoading, navigate, getDreamById, fetchDreams]);

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
                            // 重新获取梦境数据
                            fetchDreams().then(() => {
                                const foundDream = getDreamById(id);
                                if (foundDream) {
                                    setDream(foundDream);
                                } else {
                                    // 只在UI上显示错误，不使用notification
                                    setError("找不到该梦境记录");
                                }
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
    if (authLoading || dreamsLoading || !dream) {
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

                    {/* 梦境内容 - 使用ReactMarkdown渲染 */}
                    <div className="dream-content text-gray-100 leading-relaxed">
                        <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                            {dream.content}
                        </ReactMarkdown>
                    </div>

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