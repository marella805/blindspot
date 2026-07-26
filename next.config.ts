import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone', // required for Docker standalone build
}

export default nextConfig
