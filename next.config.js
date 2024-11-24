/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'pbuqlylgktjdhjqkvwnv.supabase.co'], // Add Supabase domain
  },
}

module.exports = nextConfig
