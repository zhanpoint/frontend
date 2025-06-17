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
        target: 'ws://localhost:8412',
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    },
    // HMR配置 - 通过WebSocket实现实时模块热替换，无需刷新页面即可更新变化的模块
    hmr: {
      protocol: 'ws',    // WebSocket协议
      host: 'localhost'  // HMR服务主机
    }
  }
});