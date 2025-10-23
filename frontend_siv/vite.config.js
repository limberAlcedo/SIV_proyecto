import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5179,        // Cambia por el puerto que quieras, ej. 3000
    host: true         // Permite acceso desde otros dispositivos
  }
})
