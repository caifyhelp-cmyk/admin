import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
<<<<<<< HEAD
  plugins: [react()],
  base: '/admin/',
  build: {
    sourcemap: false,
  },
=======
  plugins: [
    tailwindcss(),
    react()
  ],
>>>>>>> f453829 (update admin ui)
})
