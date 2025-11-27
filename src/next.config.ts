/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public'
});

const nextConfig = {
  experimental: {
    serverActions: true,
  },
};

module.exports = withPWA(nextConfig);
