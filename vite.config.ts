import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    watch: {
      // Watch the config file for changes
      ignored: ['!**/public/template_1_config.json'],
    },
    // Proxy removed - API calls now use VITE_API_URL from .env file
    // Set VITE_API_URL in .env to configure API endpoint (e.g., VITE_API_URL=http://localhost:3008)
  },
})
