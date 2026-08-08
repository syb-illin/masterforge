import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', '.eslintrc.cjs', 'vitest.config.ts', 'dist', 'src/setupTests.ts', 'src/lib/audio.ts', 'src/components/EqVisualizer.tsx', 'src/components/AudioPlayer.tsx', 'src/i18n.ts', 'src/App.tsx'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90
      }
    }
  }
})
