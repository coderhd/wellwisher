import { defineConfig } from 'vitest/config'

export default defineConfig({
	esbuild: {
		jsx: 'automatic',
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test/setup.ts'],
		include: [
			'tests/**/*.{test,spec}.{ts,tsx}',
			'src/**/*.{test,spec}.{ts,tsx}',
		],
		exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'**/node_modules/**',
				'**/e2e/**',
				'**/*.test.{ts,tsx}',
				'**/*.spec.{ts,tsx}',
				'src/test/**',
			],
		},
	},
})
