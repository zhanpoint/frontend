import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Register from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";

// 其他页面导入将在这里添加
// import HomePage from "./pages/HomePage";

/**
 * 应用路由配置
 */
const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/register",
        element: <Register />,
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    // 其他路由将在这里添加
]);

export default router; 