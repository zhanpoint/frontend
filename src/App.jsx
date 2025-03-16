import { Routes, Route } from "react-router-dom";
import { Navbar } from "./pages/Navbar";
import HomePage from "./pages/HomePage";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <div className="home-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* 其他路由将在此处添加 */}
        </Routes>
        <Toaster position="top-right" richColors closeButton />
      </div>
    </AuthProvider>
  );
}

export default App;