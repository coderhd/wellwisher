import type { NextConfig } from 'next'

const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'
const repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : ''
const isUserSite = repoName.endsWith('.github.io')

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (isGitHubActions && repoName && !isUserSite ? `/${repoName}` : undefined)

const nextConfig: NextConfig = {
	reactStrictMode: true,
	output: 'export',
	trailingSlash: true,
	basePath,
	images: {
		unoptimized: true,
	},
}

export default nextConfig
