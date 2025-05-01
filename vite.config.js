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
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('WebSocket代理错误:', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('WebSocket代理请求:', req.url);
          });
          proxy.on('proxyReqWs', (_proxyReq, req, _socket) => {
            console.log('WebSocket连接:', req.url);
          });
        }
      }
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    }
  }
});