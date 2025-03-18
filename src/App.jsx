import { Outlet } from "react-router-dom";
import { Navbar } from "./pages/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <div className="home-container">
        <Navbar />
        <Outlet />
        <Toaster position="top-right" richColors closeButton />
      </div>
    </AuthProvider>
  );
}

export default App;