import { Outlet } from "react-router-dom";
import { Navbar } from "./pages/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import { DreamsProvider } from "./contexts/DreamsContext";

function App() {
  return (
    <AuthProvider>
      <DreamsProvider>
        <div className="home-container">
          <Navbar />
          <Outlet />
        </div>
      </DreamsProvider>
    </AuthProvider>
  );
}

export default App;