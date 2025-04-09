import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";


// 获取当前文件的目录路径
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8412',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:8412',  // WebSocket代理目标
        ws: true,  // 是否代理WebSocket
        changeOrigin: true,  // 是否改变原始主机头
        secure: false,  // 允许使用非安全连接（开发环境常用）
      }
    }
  }
});