/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
  experimental: {
    serverComponentsExternalPackages: ["@ai-sdk/openai"],
  },
  serverRuntimeConfig: {
    api: {
      bodyParser: {
        sizeLimit: "1mb",
      },
    },
  },
}

module.exports = nextConfig

// Serverless Function configuration
if (process.env.VERCEL) {
  module.exports = {
    ...nextConfig,
    functions: {
      "api/**/*": {
        maxDuration: 300, // Increase to 300 seconds (5 minutes)
      },
    },
  }
}

