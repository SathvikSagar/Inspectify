import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// export default defineConfig({
//   // ...
//   optimizeDeps: {
//     include: ["leaflet"],
//   },
// });

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['dry-candies-obey.loca.lt', 'localhost', '127.0.0.1'],
  },
})
