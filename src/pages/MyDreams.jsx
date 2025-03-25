import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Search, Calendar as CalIcon, Clock, Image as ImageIcon, FolderOpen, Tags, Tag, X, Filter, Sparkles, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDreams } from "@/contexts/DreamsContext";
import "./css/MyDreams.css";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

// 标签类型颜色映射
const TAG_TYPE_COLORS = {
    theme: "text-purple-300",
    character: "text-blue-300",
    location: "text-green-300"
};

const MyDreams = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { dreams, isLoading: dreamsLoading, fetchDreams, deleteDream } = useDreams();

    // 本地状态仅用于UI控制
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sortBy, setSortBy] = useState("date-desc");
    const [categoryOptions, setCategoryOptions] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [allTags, setAllTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);

    // 删除确认对话框状态
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dreamToDelete, setDreamToDelete] = useState(null);

    // 初始化时加载数据
    useEffect(() => {
        // 确保认证状态已加载
        if (!authLoading) {
            if (isAuthenticated) {
                fetchDreams(); // 使用DreamsContext的fetchDreams
            } else {
                // 未登录，重定向到登录页
                navigate('/login', { state: { from: '/my-dreams' } });
            }
        }
    }, [isAuthenticated, authLoading, navigate, fetchDreams]);

    // 提取所有可用的分类选项
    useEffect(() => {
        if (dreams.length > 0) {
            const categories = {};
            const tagsSet = new Set();

            dreams.forEach(dream => {
                // 收集分类
                if (dream.categories && Array.isArray(dream.categories)) {
                    dream.categories.forEach(cat => {
                        if (cat.name && cat.display_name) {
                            categories[cat.name] = cat.display_name;
                        }
                    });
                }

                // 收集所有标签
                if (dream.tags) {
                    Object.values(dream.tags).forEach(tagArray => {
                        tagArray.forEach(tag => tagsSet.add(tag));
                    });
                }
            });

            setCategoryOptions(categories);
            setAllTags(Array.from(tagsSet).sort());
        }
    }, [dreams]);

    // 当筛选条件变化时进行本地筛选
    const filteredDreams = dreams.filter(dream => {
        // 搜索条件筛选 - 标题、内容和标签
        const matchesSearch = searchQuery === '' ||
            dream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dream.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (dream.tags && Object.values(dream.tags).some(tagArray =>
                tagArray.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            ));

        // 分类筛选
        const matchesCategory = selectedCategories.length === 0 ||
            (dream.categories && dream.categories.some(cat =>
                selectedCategories.includes(cat.name)
            ));

        // 日期筛选
        const matchesDate = !selectedDate ||
            (dream.created_at &&
                new Date(dream.created_at).toDateString() === new Date(selectedDate).toDateString());

        // 标签筛选
        const matchesTags = selectedTags.length === 0 ||
            (dream.tags && Object.values(dream.tags).some(tagArray =>
                tagArray.some(tag => selectedTags.includes(tag))
            ));

        return matchesSearch && matchesCategory && matchesDate && matchesTags;
    }).sort((a, b) => {
        // 排序逻辑
        const dateA = new Date(a.created_at || '');
        const dateB = new Date(b.created_at || '');

        return sortBy === 'date-desc'
            ? dateB - dateA  // 最新在前
            : dateA - dateB; // 最早在前
    });

    // 提取并对内容进行摘要处理
    const getSummary = (content) => {
        // 移除Markdown语法
        let plainText = content
            .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
            .replace(/\[.*?\]\(.*?\)/g, '$1') // 移除链接，保留文本
            .replace(/[#*_~`>]/g, ''); // 移除格式字符

        // 限制字数并添加省略号
        return plainText.length > 120
            ? plainText.substring(0, 120).trim() + '...'
            : plainText;
    };

    // 获取梦境预览图
    const getDreamPreviewImage = (dream) => {
        if (dream.images && dream.images.length > 0) {
            return dream.images[0].url;
        }
        return null;
    };

    // 渲染标签
    const renderTags = (tags) => {
        if (!tags) return null;

        const allTags = [
            ...(tags.theme || []).map(tag => ({ text: tag, type: 'theme' })),
            ...(tags.character || []).map(tag => ({ text: tag, type: 'character' })),
            ...(tags.location || []).map(tag => ({ text: tag, type: 'location' }))
        ];

        if (allTags.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-1 mt-2">
                {allTags.slice(0, 3).map((tag, index) => (
                    <span key={index} className={`text-xs ${TAG_TYPE_COLORS[tag.type] || 'text-gray-400'}`}>
                        #{tag.text}
                        {index < Math.min(allTags.length - 1, 2) && " "}
                    </span>
                ))}
                {allTags.length > 3 && (
                    <span className="text-xs text-gray-400 flex items-center">
                        <span className="mx-1">+</span>
                        {allTags.length - 3}
                    </span>
                )}
            </div>
        );
    };

    // 处理分类选择变化
    const handleCategoryChange = (categoryName) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryName)) {
                return prev.filter(item => item !== categoryName);
            } else {
                return [...prev, categoryName];
            }
        });
    };

    // 处理标签选择
    const handleTagSelect = (tag) => {
        setSelectedTags(prev => {
            if (prev.includes(tag)) {
                return prev.filter(t => t !== tag);
            } else {
                return [...prev, tag];
            }
        });
    };

    // 清除筛选
    const clearFilters = () => {
        setSearchQuery("");
        setSelectedCategories([]);
        setSelectedDate(null);
        setSelectedTags([]);
    };

    // 处理梦境删除
    const handleDeleteClick = (e, dream) => {
        e.stopPropagation(); // 阻止点击传播到卡片
        e.preventDefault(); // 阻止默认行为

        // 设置要删除的梦境并打开确认对话框
        setDreamToDelete(dream);
        setDeleteDialogOpen(true);
    };

    // 确认删除梦境
    const confirmDelete = async () => {
        if (dreamToDelete && dreamToDelete.id) {
            await deleteDream(dreamToDelete.id);
            setDeleteDialogOpen(false);
            setDreamToDelete(null);
        }
    };

    // 处理编辑点击
    const handleEditClick = (e, dreamId) => {
        e.stopPropagation(); // 阻止点击传播到卡片
        e.preventDefault(); // 阻止默认行为

        // 导航到编辑页面
        navigate(`/edit-dream/${dreamId}`);
    };

    // 渲染梦境卡片
    const renderDreamCard = (dream) => {
        const previewImage = getDreamPreviewImage(dream);

        return (
            <Card
                key={dream.id}
                className={`dream-card hover:border-purple-400 transition-all ${previewImage ? 'has-image' : ''}`}
                onClick={() => navigate(`/dreams/${dream.id}`)}
            >
                {previewImage && (
                    <div className="dream-card-image-container">
                        <div
                            className="dream-card-image"
                            style={{ backgroundImage: `url(${previewImage})` }}
                        ></div>
                        <div className="dream-card-image-overlay"></div>
                    </div>
                )}

                <CardHeader className={`pb-2 ${previewImage ? 'with-image' : ''}`}>
                    <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-bold text-purple-50 flex items-start">
                            <span className="mr-2 dream-title">{dream.title}</span>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {dream.images && dream.images.length > 0 && !previewImage && (
                                <div className="image-indicator">
                                    <ImageIcon className="h-4 w-4 text-purple-300 flex-shrink-0" />
                                    <span className="text-xs text-purple-300 ml-1">{dream.images.length}</span>
                                </div>
                            )}

                            {/* 三点菜单 */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 p-0 text-gray-400 hover:text-purple-300 hover:bg-gray-800/60 rounded-full"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="dream-actions-menu">
                                    <DropdownMenuItem
                                        className="cursor-pointer flex items-center text-blue-400 hover:text-blue-300"
                                        onClick={(e) => handleEditClick(e, dream.id)}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>编辑</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="cursor-pointer flex items-center text-red-500 hover:text-red-400"
                                        onClick={(e) => handleDeleteClick(e, dream)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>删除</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                        {dream.categories && dream.categories.map(category => (
                            <Badge
                                key={category.id}
                                className={`${CATEGORY_COLORS[category.name] || 'bg-gray-500'} text-xs`}
                            >
                                {category.display_name}
                            </Badge>
                        ))}
                    </div>

                    {dream.tags && Object.values(dream.tags).some(arr => arr.length > 0) && (
                        <div className="flex items-center text-xs text-gray-400 mt-2">
                            {renderTags(dream.tags)}
                        </div>
                    )}
                </CardHeader>

                <CardContent className={`py-2 ${previewImage ? 'with-image' : ''}`}>
                    <p className="text-sm text-gray-300 dream-content">
                        {getSummary(dream.content)}
                    </p>
                </CardContent>

                <CardFooter className="pt-2 flex justify-between text-xs text-gray-400">
                    <div className="flex items-center">
                        <CalIcon className="h-3 w-3 mr-1" />
                        {dream.created_at ? new Date(dream.created_at).toLocaleDateString() : '未知日期'}
                    </div>
                    <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {dream.created_at ? new Date(dream.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '未知时间'}
                    </div>
                </CardFooter>
            </Card>
        );
    };

    // 渲染加载骨架屏
    const renderSkeletons = () => (
        Array(3).fill(0).map((_, index) => (
            <Card key={`skeleton-${index}`} className="dream-card skeleton-card">
                <div className="skeleton-image-placeholder"></div>
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-2/3" />
                    <div className="flex gap-2 mt-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </CardHeader>
                <CardContent className="py-2">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter className="pt-2 flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-24" />
                </CardFooter>
            </Card>
        ))
    );

    // 筛选栏上方的激活筛选器显示
    const renderActiveFilters = () => {
        if (selectedCategories.length === 0 && !selectedDate && selectedTags.length === 0) {
            return null;
        }

        return (
            <div className="active-filters mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-400 flex items-center">
                    <Filter className="h-3 w-3 mr-1" />
                    筛选:
                </span>

                {selectedCategories.map(cat => (
                    <Badge
                        key={cat}
                        variant="outline"
                        className="active-filter-badge flex items-center gap-1"
                    >
                        <span>{categoryOptions[cat]}</span>
                        <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryChange(cat);
                            }}
                        />
                    </Badge>
                ))}

                {selectedDate && (
                    <Badge
                        variant="outline"
                        className="active-filter-badge flex items-center gap-1"
                    >
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        <span>{format(selectedDate, 'yyyy-MM-dd')}</span>
                        <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(null);
                            }}
                        />
                    </Badge>
                )}

                {selectedTags.map(tag => (
                    <Badge
                        key={tag}
                        variant="outline"
                        className="active-filter-badge flex items-center gap-1"
                    >
                        <span>#{tag}</span>
                        <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleTagSelect(tag);
                            }}
                        />
                    </Badge>
                ))}

                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-400 hover:text-white clear-filters-btn"
                    onClick={clearFilters}
                >
                    清除全部
                </Button>
            </div>
        );
    };

    return (
        <div className="my-dreams-container max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Moon className="h-8 w-8 text-purple-400" />
                    <h1 className="text-2xl font-bold text-purple-50">我的梦境</h1>
                </div>
                <Button
                    className="create-dream-btn"
                    onClick={() => navigate('/create-post')}
                >
                    <Sparkles className="h-4 w-4 mr-2" />
                    记录新梦境
                </Button>
            </div>

            {/* 搜索和筛选功能栏 */}
            <div className="filter-bar mb-6">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="search-container relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            type="search"
                            placeholder="搜索我的梦境..."
                            className="pl-10 bg-gray-800/60 border-gray-700 search-input"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="filter-controls flex flex-wrap gap-2">
                        {/* 多选分类筛选 */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="category-filter-btn">
                                    <FolderOpen className="h-4 w-3 mr-1" />
                                    分类
                                    {selectedCategories.length > 0 && (
                                        <Badge className="ml-2 bg-purple-600">{selectedCategories.length}</Badge>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="category-popover">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm mb-3">选择梦境分类</h4>
                                    <div className="categories-grid">
                                        {Object.entries(categoryOptions).map(([name, displayName]) => (
                                            <div key={name} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`category-${name}`}
                                                    checked={selectedCategories.includes(name)}
                                                    onCheckedChange={() => handleCategoryChange(name)}
                                                    className={`${CATEGORY_COLORS[name]}`}
                                                />
                                                <Label
                                                    htmlFor={`category-${name}`}
                                                    className="cursor-pointer text-sm"
                                                >
                                                    {displayName}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* 添加标签云到同一行 */}
                        {allTags.length > 0 && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="tags-filter-btn">
                                        <Tags className="h-4 w-3 mr-1" />
                                        标签
                                        {selectedTags.length > 0 && (
                                            <Badge className="ml-2 bg-purple-600">{selectedTags.length}</Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="tags-popover">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-sm">选择标签</h4>
                                            {selectedTags.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs text-purple-300 clear-tags-btn"
                                                    onClick={() => setSelectedTags([])}
                                                >
                                                    清除标签
                                                </Button>
                                            )}
                                        </div>
                                        <div className="tag-cloud-container">
                                            <div className="flex flex-wrap gap-2">
                                                {allTags.map(tag => (
                                                    <Badge
                                                        key={tag}
                                                        className={`tag-cloud-item cursor-pointer ${selectedTags.includes(tag)
                                                            ? 'bg-purple-600 hover:bg-purple-700'
                                                            : 'bg-gray-700/70 hover:bg-gray-600/90'
                                                            }`}
                                                        onClick={() => handleTagSelect(tag)}
                                                    >
                                                        #{tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}

                        {/* 日期选择器 */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={`date-filter-btn ${selectedDate ? "date-selected" : ""}`}>
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    {selectedDate ? format(selectedDate, 'yyyy-MM-dd') : "日期"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    className="rounded-md border"
                                />
                            </PopoverContent>
                        </Popover>

                        {/* 排序*/}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-32 sort-select bg-gray-800/60 border-gray-700">
                                <SelectValue placeholder="排序" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date-desc">最新发布</SelectItem>
                                <SelectItem value="date-asc">最早发布</SelectItem>
                            </SelectContent>
                        </Select>



                        {(selectedCategories.length > 0 || selectedDate || selectedTags.length > 0) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="clear-all-btn"
                                onClick={clearFilters}
                            >
                                <X className="h-4 w-4 mr-1" />
                                清除
                            </Button>
                        )}
                    </div>
                </div>

                {/* 激活的筛选器 */}
                {renderActiveFilters()}
            </div>

            {/* 梦境列表 */}
            <div className="dreams-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dreamsLoading ? (
                    renderSkeletons()
                ) : filteredDreams.length > 0 ? (
                    filteredDreams.map(renderDreamCard)
                ) : (
                    <div className="empty-state col-span-full flex flex-col items-center justify-center p-8">
                        <Moon className="h-16 w-16 text-gray-600 mb-4" />
                        <h3 className="text-xl font-medium text-gray-400 mb-2">没有找到梦境</h3>
                        <p className="text-gray-500 text-center mb-4">
                            {searchQuery || selectedCategories.length > 0 || selectedDate || selectedTags.length > 0
                                ? "尝试调整您的筛选条件"
                                : "记录您的第一个梦境，开始探索梦的奥秘"}
                        </p>
                        {searchQuery || selectedCategories.length > 0 || selectedDate || selectedTags.length > 0 ? (
                            <Button variant="outline" onClick={clearFilters}>
                                清除筛选条件
                            </Button>
                        ) : (
                            <Button onClick={() => navigate('/create-post')}>
                                创建梦境记录
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* 删除确认对话框 */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-gray-900 border border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除梦境</AlertDialogTitle>
                        <AlertDialogDescription>
                            您确定要删除「{dreamToDelete?.title}」吗？此操作无法撤销，删除后梦境记录将永久消失。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700">
                            取消
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default MyDreams; 