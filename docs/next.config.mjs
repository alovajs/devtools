import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true },
  basePath: process.env.NEXT_BASE_PATH || '',
  // Shiki uses native ESM modules that need to stay external to Webpack bundling
  serverExternalPackages: ['shiki', '@shikijs/twoslash'],
}

export default withMDX(config)
