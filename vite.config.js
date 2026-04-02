import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      port: 3210,
      proxy: {
        "/api": {
          target: "https://open.bigmodel.cn",
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("Authorization", "Bearer " + (env.API_KEY || ""));
            });
          },
        },
      },
    },
  };
});
