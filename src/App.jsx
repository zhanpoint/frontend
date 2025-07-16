import { Outlet } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useEffect } from "react";
import { fetchFeatureFlags } from "./config/features";

function App() {
    // 初始化功能开关配置
    useEffect(() => {
        fetchFeatureFlags().catch(console.error);
    }, []);

    return (
        <ThemeProvider>
            <AuthProvider>
                <div className="home-container">
                    <Navbar />
                    <main className="main-content">
                        <Outlet />
                    </main>
                    <Footer />
                </div>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;