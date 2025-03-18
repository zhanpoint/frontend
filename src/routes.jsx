import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Register from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import CreatePost from "./pages/CreatePost";
import HomePage from "./pages/HomePage";
import PrivateRoute from "./components/auth/PrivateRoute";

// 其他页面导入将在这里添加
// import HomePage from "./pages/HomePage";

/**
 * 应用路由配置
 */
const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: "create-post",
                element: (
                    <PrivateRoute>
                        <CreatePost />
                    </PrivateRoute>
                ),
            },
        ],
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