import { Outlet } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import { DreamsProvider } from "./contexts/DreamsContext";
import DreamAIAgent from "./features/dreams/components/DreamAIAgent";
import { useEffect } from "react";
import { fetchFeatureFlags } from "./config/features";

function App() {
    // 初始化功能开关配置
    useEffect(() => {
        fetchFeatureFlags().catch(console.error);
    }, []);

    return (
        <AuthProvider>
            <DreamsProvider>
                <div className="home-container">
                    <Navbar />
                    <Outlet />
                    <DreamAIAgent />
                </div>
            </DreamsProvider>
        </AuthProvider>
    );
}

export default App;