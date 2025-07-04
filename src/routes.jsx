import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Register from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CreatePost from "./pages/CreatePost";
import HomePage from "./pages/HomePage";
import MyDreams from "./pages/MyDreams";
import DreamDetail from "./pages/DreamDetail";
import EditDream from "./pages/EditDream";
import PrivateRoute from "./features/auth/components/PrivateRoute";

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
            {
                path: "my-dreams",
                element: (
                    <PrivateRoute>
                        <MyDreams />
                    </PrivateRoute>
                ),
            },
            {
                path: "dreams/:id",
                element: (
                    <PrivateRoute>
                        <DreamDetail />
                    </PrivateRoute>
                ),
            },
            {
                path: "edit-dream/:dreamId",
                element: (
                    <PrivateRoute>
                        <EditDream />
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
    {
        path: "/forgot-password",
        element: <ResetPasswordPage />,
    },
    // 其他路由将在这里添加
]);

export default router; 