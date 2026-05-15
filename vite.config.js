import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { schoolApiPlugin } from './mockSchoolApi'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    // El mock de la API solo se usa en desarrollo local (npm run dev)
    // En producción, Cloudflare Pages sirve las functions/ directamente
    // ...(command === 'serve' ? [schoolApiPlugin()] : []),
  ],
}))
