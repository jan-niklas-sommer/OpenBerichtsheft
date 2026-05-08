import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "istanbul",
      include: ["src/lib/**", "src/hooks/**", "src/app/api/**", "src/components/**"],
      exclude: [
        "src/app/api/auth/**",
        "src/lib/prisma.ts",
        "src/lib/auth.ts",
        "src/components/ui/theme-provider.tsx",
        "src/components/ui/theme-toggle.tsx",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
