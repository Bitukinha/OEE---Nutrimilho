import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const useProxy = env.VITE_SUPABASE_USE_PROXY === "true";

  return {
    server: {
      host: "::",
      port: 8082,
      proxy:
        useProxy && supabaseUrl && serviceRoleKey
          ? {
              "/supabase": {
                target: supabaseUrl,
                changeOrigin: true,
                rewrite: (requestPath) => requestPath.replace(/^\/supabase/, ""),
                configure: (proxy) => {
                  proxy.on("proxyReq", (proxyReq) => {
                    proxyReq.setHeader("apikey", serviceRoleKey);
                    proxyReq.setHeader("Authorization", `Bearer ${serviceRoleKey}`);
                  });
                },
              },
            }
          : undefined,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
