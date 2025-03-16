import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Menu, Book, Compass, Users } from "lucide-react";
import "./css/Navbar.css";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/user/UserAvatar";

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/Button.jsx";
import { Input } from "@/components/ui/input";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";


// 定义导航栏属性接口
const Navbar = ({
    logo = {
        url: "/",
        src: "/assets/logo.svg",
        alt: "梦境门户",
        title: "梦境门户",
    },
    menu = [
        { title: "首页", url: "/" },
        {
            title: "探索",
            url: "#",
            icon: <Compass className="size-5 shrink-0" />,
            items: [
                {
                    title: "最新梦境",
                    description: "浏览最新记录的梦境内容",
                    icon: <Compass className="size-5 shrink-0" />,
                    url: "/explore/latest",
                },
                {
                    title: "热门梦境",
                    description: "查看社区热门的梦境记录",
                    icon: <Compass className="size-5 shrink-0" />,
                    url: "/explore/trending",
                },
            ],
        },
        {
            title: "知识中心",
            url: "#",
            icon: <Book className="size-5 shrink-0" />,
            items: [
                {
                    title: "梦境科学",
                    description: "了解梦境背后的科学原理",
                    icon: <Book className="size-5 shrink-0" />,
                    url: "/knowledge/science",
                },
                {
                    title: "梦境符号学",
                    description: "探索梦境中符号的含义",
                    icon: <Book className="size-5 shrink-0" />,
                    url: "/knowledge/symbols",
                },
                {
                    title: "梦境技巧",
                    description: "学习记忆和控制梦境的技巧",
                    icon: <Book className="size-5 shrink-0" />,
                    url: "/knowledge/techniques",
                },
            ],
        },
        {
            title: "社区",
            url: "#",
            icon: <Users className="size-5 shrink-0" />,
            items: [
                {
                    title: "解梦论坛",
                    description: "分享您的梦境，获取他人解读",
                    icon: <Users className="size-5 shrink-0" />,
                    url: "/community/forum",
                },
                {
                    title: "梦境挑战",
                    description: "参与社区梦境记录挑战",
                    icon: <Users className="size-5 shrink-0" />,
                    url: "/community/challenges",
                },
            ],
        },
    ],
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    // 渲染桌面端菜单项
    const renderMenuItem = (item) => {
        if (item.items) {
            return (
                <NavigationMenuItem key={item.title} className="nav-menu-trigger">
                    <NavigationMenuTrigger className="nav-menu-trigger">{item.title}</NavigationMenuTrigger>
                    <NavigationMenuContent className="nav-menu-content">
                        <ul className="nav-menu-grid">
                            {item.items.map((subItem) => (
                                <li key={subItem.title}>
                                    <NavigationMenuLink asChild>
                                        <a
                                            className="nav-menu-item"
                                            href={subItem.url}
                                        >
                                            <div className="nav-menu-item-title">
                                                {subItem.icon}
                                                <div>{subItem.title}</div>
                                            </div>
                                            {subItem.description && (
                                                <p className="nav-menu-item-desc">
                                                    {subItem.description}
                                                </p>
                                            )}
                                        </a>
                                    </NavigationMenuLink>
                                </li>
                            ))}
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            );
        }

        return (
            <NavigationMenuItem key={item.title}>
                <NavigationMenuLink asChild>
                    <a
                        className="nav-link"
                        href={item.url}
                    >
                        {item.title}
                    </a>
                </NavigationMenuLink>
            </NavigationMenuItem>
        );
    };

    // 渲染移动端菜单项
    const renderMobileMenuItem = (item) => {
        if (item.items) {
            return (
                <AccordionItem key={item.title} value={item.title} className="border-b-0">
                    <AccordionTrigger className="mobile-nav-item">
                        <div className="flex items-center gap-2">
                            {item.icon}
                            {item.title}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="mt-2 space-y-2">
                        {item.items.map((subItem) => (
                            <a
                                key={subItem.title}
                                className="nav-menu-item"
                                href={subItem.url}
                            >
                                {subItem.icon}
                                <div>
                                    <div className="nav-menu-item-title">{subItem.title}</div>
                                    {subItem.description && (
                                        <p className="nav-menu-item-desc">
                                            {subItem.description}
                                        </p>
                                    )}
                                </div>
                            </a>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            );
        }

        return (
            <a
                key={item.title}
                href={item.url}
                className="mobile-nav-item"
            >
                {item.icon}
                {item.title}
            </a>
        );
    };

    return (
        <header className="dream-navbar">
            <div className="navbar-container">
                {/* Logo */}
                <div className="navbar-logo">
                    <a href={logo.url} className="flex items-center gap-2">
                        <img src={logo.src} className="h-8 w-8" alt={logo.alt} />
                        <span className="navbar-logo-text">
                            {logo.title}
                        </span>
                    </a>
                </div>

                {/* 桌面端导航 */}
                <div className="navbar-menu">
                    <NavigationMenu>
                        <NavigationMenuList>
                            {menu.map((item) => renderMenuItem(item))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* 搜索框和用户菜单 */}
                <div className="navbar-tools">
                    {/* 搜索框 */}
                    <div className="search-container">
                        <Search className="search-icon" />
                        <Input
                            type="search"
                            placeholder="搜索..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* 用户菜单 */}
                    {!isLoading && (
                        isAuthenticated ? (
                            <UserAvatar />
                        ) : (
                            <div className="user-buttons">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="login-button"
                                    onClick={() => navigate('/login')}
                                >
                                    登录
                                </Button>
                                <Button
                                    size="sm"
                                    className="signup-button"
                                    onClick={() => navigate('/register')}
                                >
                                    注册
                                </Button>
                            </div>
                        )
                    )}

                    {/* 移动端菜单 */}
                    <div className="mobile-menu">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="mobile-menu-content">
                                <SheetHeader>
                                    <SheetTitle>
                                        <a href={logo.url} className="flex items-center gap-2">
                                            <img src={logo.src} className="h-8 w-8" alt={logo.alt} />
                                            <span className="navbar-logo-text">
                                                {logo.title}
                                            </span>
                                        </a>
                                    </SheetTitle>
                                </SheetHeader>

                                <div className="my-6 flex flex-col gap-6">
                                    {/* 移动端搜索框 */}
                                    <div className="mobile-search">
                                        <Search className="search-icon" />
                                        <Input
                                            type="search"
                                            placeholder="搜索..."
                                            className="search-input"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    {/* 移动端导航 */}
                                    <Accordion
                                        type="single"
                                        collapsible
                                        className="flex w-full flex-col gap-4"
                                    >
                                        {menu.map((item) => renderMobileMenuItem(item))}
                                    </Accordion>

                                    {/* 移动端用户操作 */}
                                    {!isLoading && !isAuthenticated && (
                                        <div className="mobile-buttons">
                                            <Button
                                                variant="outline"
                                                className="login-button"
                                                onClick={() => navigate('/login')}
                                            >
                                                登录
                                            </Button>
                                            <Button
                                                className="signup-button"
                                                onClick={() => navigate('/register')}
                                            >
                                                注册
                                            </Button>
                                        </div>
                                    )}

                                    {/* 移动端用户头像 */}
                                    {!isLoading && isAuthenticated && (
                                        <div className="flex justify-center py-4">
                                            <UserAvatar />
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
};

export { Navbar };