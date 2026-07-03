import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['src/backend/**/*.test.ts', 'api/**/*.test.ts'],
    testTimeout: 10000,
  },
})
