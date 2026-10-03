import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Embedded geography changes less often than the app. Cache its pure data
  // separately without adding a runtime mapping service or asynchronous state.
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'physical-geography', test: /\/game\/(worldMapGeometry|worldRiverCourses|riverCourses)\.ts$/ },
            { name: 'theatre-geography', test: /\/game\/theatreGeometry\.ts$/ },
          ],
        },
      },
    },
  },
})
