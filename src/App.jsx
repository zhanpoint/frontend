import { Navbar } from "./pages/Navbar";
import HomePage from "./pages/HomePage";

function App() {
  // 导航栏数据
  const navbarData = {
    user: {
      isLoggedIn: false,
      login: { text: "登录", url: "/login" },
      signup: { text: "注册", url: "/signup" },
    },
  };

  return (
    <div className="home-container">
      <Navbar {...navbarData} />
      <HomePage />
    </div>
  );
}

export default App;