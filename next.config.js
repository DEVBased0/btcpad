/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID,
    GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID,
  },
}

module.exports = nextConfig
